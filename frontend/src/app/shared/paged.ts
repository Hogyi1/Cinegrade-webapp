// [AI-GENERATED]
import { Observable } from 'rxjs';
import { PagedModelPostSummaryResponse } from '../services/models/paged-model-post-summary-response';
import { PostSummaryResponse } from '../services/models/post-summary-response';

export const PAGE_SIZE = 12;

/** True when the page just loaded is the last one (Spring's PagedModel: page.number is 0-based). */
export function isLastPage(res: PagedModelPostSummaryResponse): boolean {
  const page = res.page;
  return !page || (page.number ?? 0) + 1 >= (page.totalPages ?? 0);
}

export type PageLoader = (page: number) => Observable<PagedModelPostSummaryResponse>;
export type Posts = PostSummaryResponse[];
