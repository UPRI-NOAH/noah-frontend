import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

/**
 * Stores the state of a page at a given time.
 * Provide the extending classes at the component-level.
 *
 * The `state` must not be directly editable. Use the
 * `patch` and `set` values to modify the state.
 */
export abstract class StoreService<T> {
  protected abstract store: string;
  protected bs: BehaviorSubject<T>;
  private _state$: Observable<T>;
  private _state: T;
  private _previous: T;
  private _initialState: Partial<T>;
  private _unsubscribeAll: Subject<T>;

  get state$(): Observable<T> {
    return this._state$;
  }

  get state(): T {
    return this._state;
  }

  get previous(): T {
    return this._previous;
  }

  get initialState(): Partial<T> {
    return this._initialState;
  }

  constructor(initialValue: Partial<T>) {
    this._initialState = { ...initialValue };
    this.bs = new BehaviorSubject<T>(initialValue as T);
    this._state$ = this.bs.asObservable();

    this._unsubscribeAll = new Subject();

    this._state = initialValue as T;
    this._state$.pipe(takeUntil(this._unsubscribeAll)).subscribe((s) => {
      this._state = s;
    });

    this._previous = this._state;
  }

  /**
   * Unsubscribe from the state.
   * Should be called by the component's ngOnDestroy lifecycle hook.
   */
  destroy(event: string = 'destroy state') {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    console.groupCollapsed(`[${this.store} store] [destroy] [event: ${event}]`);
  }

  patch(newValue: Partial<T>, event: string = 'Not specified') {
    this._previous = this._state;
    const newState = Object.assign({}, this._state, newValue);
    if (!environment.production) {
      console.groupCollapsed(`[${this.store} store] [patch] [event: ${event}]`);
      console.log('change', newValue);
      console.log('prev', this._previous);
      console.log('next', newState);
      console.groupEnd();
    }
    this.bs.next(newState);
  }

  set(newValue: Partial<T>, event: string = 'Not specified') {
    this._previous = this._state;
    const newState = Object.assign({}, newValue) as T;
    if (!environment.production) {
      console.groupCollapsed(`[${this.store} store] [set] [event: ${event}]`);
      console.log('change', newValue);
      console.log('prev', this._previous);
      console.log('next', newState);
      console.groupEnd();
    }
    this.bs.next(newState);
  }

  reset(event: string = 'reset _state to initial value') {
    this._previous = this._state;
    const newState = Object.assign({}, this._initialState) as T;
    if (!environment.production) {
      console.groupCollapsed(`[${this.store} store] [set] [event: ${event}]`);
      console.log('change', this._initialState);
      console.log('prev', this._previous);
      console.log('next', newState);
      console.groupEnd();
    }
    this.bs.next(newState);
  }
}
