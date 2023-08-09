import { Injectable } from '@angular/core';
import { Users } from '../models/user';
import { BehaviorSubject, Observable, of, take, map, mergeMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NotifierService } from 'src/app/core/services/notifier.service';
import { generateToken } from 'src/app/shared/util/helpers'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {

  private _users$ = new BehaviorSubject<Users[]>([]);
  private users$ = this._users$.asObservable();

  constructor(private httpClient: HttpClient, private notifier: NotifierService) { }

  loadUsers(): void {
    this.httpClient.get<Users[]>(environment.baseApiUrl + '/users').subscribe({
      next: (users) => {
        this._users$.next(users);
      },
      error: () => {
        this.notifier.showError('Error', 'No se pueden recuperar los estudiantes')
      }
    });
  }

  getUsers(): Observable<Users[]> {
    return this.users$;
  };


  createdUser(user: Users): void {
    const token = generateToken(22)
    this.httpClient.post<Users>(environment.baseApiUrl + '/users', {... user, token})
      .pipe(
        mergeMap((userCreated) => this.users$.pipe(
          take(1),
          map((data) => [...data, userCreated])
        ))
      )
      .subscribe({
        next: (userData) => {
          this._users$.next(userData);
        }
      })
  };

  updatedUser(id: number, dataUpdated: Users): void {
    this.httpClient.put(environment.baseApiUrl + '/users/' + id, dataUpdated).subscribe({
      next: () => this.loadUsers()
    })
  };

  deleteUser(id: number): void {
    this.httpClient.delete(environment.baseApiUrl + '/users/' + id)
      .pipe(
        mergeMap(
          (userDeleted) => this.users$.pipe(
            take(1), map((data) => data.filter((user) => user.id !== id))
          )
        )
      ).subscribe({
        next: (dataUser) => this._users$.next(dataUser)
      });
  };

  getUserById(id: number): Observable<Users | undefined> {
    return this.users$.pipe(
      take(1),
      map((users) => users.find((user) => user.id === id)),)
  }
}