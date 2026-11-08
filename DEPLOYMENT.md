# How CineGrade is hosted

My own notes on how the public site works, written down so I don't forget it.

## The short version

I have my own Tailscale network (a tailnet). My PC (the host, where the app runs in Docker)
and my Oracle VM (the public front door) are both inside it.

```
Visitor's browser
  -> cinegrade.duckdns.org        DuckDNS turns the name into 80.225.94.210
  -> Caddy on the VM, port 443    HTTPS ends here
  -> encrypted Tailscale tunnel
  -> my PC, 100.106.48.68:8000    my tailnet IP
  -> tailscale serve              passes it on to 127.0.0.1:8000
  -> nginx container              serves the Angular app, sends /api/ to the backend
  -> backend container, 8080      Spring Boot
  -> Postgres container
```

Email goes the other way: the backend connects out to `smtp.gmail.com:587`.

## The pieces

### Tailscale

Tailscale is a closed, private network that runs on top of the normal internet. Only devices
logged in to my account are in it, and the traffic between them is encrypted.

| Device | Tailnet IP | Role |
|---|---|---|
| `proart-hogyi` (my PC) | `100.106.48.68` | runs the app |
| `vpn-vnic` (Oracle VM) | `100.90.218.4` | public front door, tagged `tag:vm` |
| `pixel-9` (my phone) | `100.72.225.111` | just my phone |

Each device keeps its 100.x address even if it changes Wi-Fi. My normal public IP (the 81.x one
I see on whatsmyipaddress) belongs to my internet connection and can change. Nothing in this
setup depends on it.

Visitors don't need Tailscale. Only the VM and my PC have to be on it.

### The VM

An Oracle AMD micro VM in Milan, public IP `80.225.94.210`. It's the only part of the setup
the internet can reach. SSH into it with `ssh oracle-vpn`.

The VM is **not** a DNS resolver. DuckDNS does the DNS part, the VM is just where visitors
end up.

### DuckDNS

`cinegrade.duckdns.org` points to the VM's public IP. That's its whole job.

### Caddy (on the VM)

Caddy is a **reverse proxy**, not a forward proxy. A forward proxy works for the people browsing
(like my exit node does for me). A reverse proxy works for the server: visitors talk to Caddy,
and Caddy fetches the answer from my PC.

Caddy doesn't give out certificates. It automatically gets one from a certificate authority
(like Let's Encrypt) for the domain name, not for the IP, and uses it with visitors.

`/etc/caddy/Caddyfile`:

```
cinegrade.duckdns.org {
    encode zstd gzip
    reverse_proxy 100.106.48.68:8000
}
```

Caddy sends the traffic to my tailnet IP, not my public IP, so my home IP stays hidden and I
don't have to open anything on my router.

### The app (on my PC)

Docker publishes the frontend on `127.0.0.1:8000` only. `tailscale serve` takes what arrives on
my tailnet IP at port 8000 and passes it to localhost. Port 8000 is never open to the internet
or to my Wi-Fi, only to my tailnet.

`.env` picks the environment (`APP_ENV=prod`), and `.env.prod` holds the settings. Start it with:

```
docker compose --profile app up -d
```

## Ports

| Where | Port | Open to | What for |
|---|---|---|---|
| VM | 80, 443 | the internet | Caddy |
| VM | 22 | the internet | SSH |
| My PC | 8000 | my tailnet, and the VM is limited to this port | the app |
| My PC | 587 | nothing, it's outgoing only | sending email through Gmail |

On Oracle, ports have to be opened in **two** places: the Security List in the Oracle console
and iptables on the VM itself.

## Could I have used the tailnet IP for everything?

Only for myself. 100.x addresses work from my own devices only, so visitors could never reach
them. That's why the VM with a public IP has to exist.

## Security

- My home IP stays hidden, and my router has no open ports.
- Visitors only ever talk to the VM directly.
- Their requests still reach the app on my PC, so a bug in the app is still a real risk. The
  setup hides my network, it doesn't make the app safe.
- By default every device on a tailnet can reach every other one, so a hacked VM could have tried
  other things on my PC. I restricted that with a tag and this Tailscale policy:

```json
{
    "tagOwners": {
        "tag:vm": ["autogroup:admin"],
    },

    "grants": [
        // Me (PC and phone) can still reach everything, including the exit node
        { "src": ["autogroup:member"], "dst": ["*"], "ip": ["*"] },

        // The VM can only reach the app on my PC
        { "src": ["tag:vm"], "dst": ["100.106.48.68"], "ip": ["tcp:8000"] },
    ],

    "ssh": [
        {
            "action": "check",
            "src":    ["autogroup:member"],
            "dst":    ["autogroup:self"],
            "users":  ["autogroup:nonroot", "root"],
        },
    ],
}
```

Ping from the VM to my PC still works and that's fine. Tailscale allows ping to any device the
sender may reach on at least one port. To test the rule, try a TCP port instead:
`nc -zv -w 5 100.106.48.68 7680` should time out.

## Things to remember

- My PC and the containers have to be running, or the site gives a 502. A 502 means Caddy is
  fine but can't reach the app.
- `FRONTEND_URL` in `.env.prod` must be `https://cinegrade.duckdns.org`, because the activation
  email builds its link from it. I keep `CORS_ALLOWED_ORIGINS` set to the same value.
- Never run `docker compose down -v` or delete the `cinegrade_db_prod` volume unless I mean it.
  That volume is the whole production database, including every account.
- After changing `.env.prod`, run the `docker compose` command above again.
- The iptables rules on the VM need saving or they're gone after a reboot:
  `sudo apt install -y iptables-persistent`, then `sudo netfilter-persistent save`.
