package hu.elte.ik.thesis.cinegrade.session;

public enum ClientType {
    WEB,
    DESKTOP;

    // [AI-GENERATED] The desktop app adds this to its WebView user agent and sends it from its own HTTP client
    private static final String DESKTOP_AGENT = "CineGradeDesktop";

    private ClientType() {

    }

    // [AI-GENERATED METHOD]
    /**
     * Which client a request comes from, by its User-Agent header. For display only (the session list):
     * anyone can send any User-Agent, so never allow or deny anything based on this.
     */
    public static ClientType from(String userAgent) {
        return userAgent != null && userAgent.contains(DESKTOP_AGENT) ? DESKTOP : WEB;
    }

    // [AI-GENERATED METHOD]
    /** The device name stored with a new session, or null when there is nothing better than the client type. */
    public String deviceName() {
        return this == DESKTOP ? "CineGrade desktop app" : null;
    }
}
