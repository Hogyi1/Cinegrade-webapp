// [AI-GENERATED]
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PostsService } from '../services/services/posts.service';
import { TokenService } from '../services/token/token.service';

type Toggle = { likedByMe?: boolean; savedByMe?: boolean; likeCount?: number; id?: number };

/**
 * Like and save for any post card. The change shows straight away and is undone if the
 * request fails. Logged-out users are sent to the login page instead.
 */
@Injectable({ providedIn: 'root' })
export class PostActionsService {
  private readonly posts = inject(PostsService);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  /** Calls update() with the new state now, and again with the old state if the server says no. */
  toggleLike<T extends Toggle>(post: T, update: (post: T) => void): void {
    if (!this.requireLogin()) {
      return;
    }
    const liked = post.likedByMe === true;
    const next = { ...post, likedByMe: !liked, likeCount: Math.max(0, (post.likeCount ?? 0) + (liked ? -1 : 1)) };
    const params = { id: post.id! };
    this.run(liked ? this.posts.unlikePost(params) : this.posts.likePost(params), next, post, update);
  }

  toggleSave<T extends Toggle>(post: T, update: (post: T) => void): void {
    if (!this.requireLogin()) {
      return;
    }
    const saved = post.savedByMe === true;
    const next = { ...post, savedByMe: !saved };
    const params = { id: post.id! };
    this.run(saved ? this.posts.unsavePost(params) : this.posts.savePost(params), next, post, update);
  }

  private run<T>(request: Observable<void>, next: T, previous: T, update: (post: T) => void): void {
    update(next);
    request.subscribe({ error: () => update(previous) });
  }

  private requireLogin(): boolean {
    if (this.tokens.isLoggedIn()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
