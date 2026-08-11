import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  username = '';
  password = '';
  loginError = '';

  constructor(private router: Router) {}

  login(): void {

    if (this.username === 'admin' && this.password === '1234') {

      sessionStorage.setItem('workoutLoggedIn', 'true');

      this.router.navigate(['/members']);

    } else {

      this.loginError = 'Benutzername oder Passwort ist falsch.';

    }
  }
}