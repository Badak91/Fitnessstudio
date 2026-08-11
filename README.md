# WORKOUT Fitness-Studio #

## Projektbeschreibung ##

WORKOUT Fitness-Studio ist eine Angular-Webanwendung zur Verwaltung eines Fitnessstudios.

Die Anwendung enthält eine Startseite, einen Login-Bereich und eine umfangreiche Mitgliederverwaltung.

Mitglieder, Kurse und Buchungen können verwaltet und ausgewertet werden.

---

## Funktionen ##

-- Mitgliederverwaltung --

- Mitglieder anzeigen
- Mitglieder hinzufügen
- M1itglieder bearbeiten
- Mitglieder löschen
- Mitgliederdetails anzeigen
- Mitglieder suchen
- Nach Zahlungsstatus filtern
- Nach Trainingsplan filtern
- Nach Tarif filtern
- Mitglieder alphabetisch sortieren
- Pagination mit 5 oder 10 Mitgliedern pro Seite
- Mitgliederdetails drucken

Mitgliederinformationen

Für Mitglieder werden unter anderem folgende Daten gespeichert:

- Mitgliedsnummer
- Name
- E-Mail
- Telefonnummer
- Stadt
- Firma
- Eintrittsdatum
- Trainingsplan
- Tarif
- Monatsbeitrag
- Zahlungsstatus

Die Mitgliedsnummer wird automatisch erstellt.

Tarife

Die Anwendung unterstützt folgende Tarife:

- Basic
- Premium
- VIP
- Trainingspläne

Folgende Trainingspläne stehen zur Verfügung:

- Ganzkörpertraining
- Muskelaufbau
- Ausdauer & Cardio
- Gewichtsreduktion
- Personal Training
- Kursverwaltung

Kurse können vollständig verwaltet werden.

Funktionen:

- Kurse anzeigen
- Kurs hinzufügen
- Kurs bearbeiten
- Kurs löschen
- Kurs buchen
- Buchung stornieren
- Freie Plätze anzeigen
- Kurskapazität verwalten
- Kursliste drucken

Ein Kurs enthält beispielsweise:

- Kursname
- Wochentag
- Uhrzeit
- Trainer
- Gesamtplätze
- Freie Plätze
- Buchungen

Mitglieder können für Kurse angemeldet werden.

Die Anwendung verhindert doppelte Buchungen desselben Mitglieds für denselben Kurs.

Beim Buchen wird automatisch ein freier Platz abgezogen.

Beim Stornieren wird der Platz wieder freigegeben.

Dashboard und Statistik

Die Anwendung zeigt verschiedene Kennzahlen an.

Dazu gehören:

- Anzahl der Mitglieder
- Anzahl der Städte
- Anzahl der Trainingspläne
- Offene Beiträge
- Anzahl der Buchungen
- Anteil bezahlter Beiträge
- Beliebtester Trainingsplan
- Durchschnittliche Kursauslastung

Zusätzlich werden Diagramme für folgende Bereiche angezeigt:

- Zahlungsstatus
- Trainingspläne
- Kursauslastung
- Daten speichern

Die Daten werden im Browser mit localStorage gespeichert.

Dadurch bleiben Änderungen auch nach dem Neuladen der Seite erhalten.

Gespeichert werden:

- Mitglieder
- Kurse
- Buchungen
- Import und Export

Die Anwendung unterstützt verschiedene Möglichkeiten zur Datensicherung.

CSV-Export

Mitglieder können als CSV-Datei exportiert werden.

JSON-Sicherung

Mitglieder, Kurse und Buchungen können gemeinsam als JSON-Datei gesichert werden.

JSON-Import

Eine zuvor gespeicherte JSON-Datei kann wieder importiert werden.

Reset

Mit der Reset-Funktion können die lokalen Änderungen zurückgesetzt werden.

Dabei werden gespeicherte Mitglieder, Kurse und Buchungen zurückgesetzt.

## Verwendete Technologien ##

- Angular
- TypeScript
- HTML
- CSS
- Bootstrap
- JSONPlaceholder API
- LocalStorage
- SessionStorage
- API

Für die ursprünglichen Mitgliederdaten wird folgende öffentliche API verwendet:

https://jsonplaceholder.typicode.com/users

Die API-Daten werden innerhalb der Anwendung um fitnessstudio-spezifische Informationen erweitert.

## Projektstruktur ##

Fitnessstudio
│
├── public
│   └── assets
│       └── images
│           └── workout.webp
│
├── src
│   ├── app
│   │   ├── guards
│   │   │   └── auth.guard.ts
│   │   │
│   │   ├── pages
│   │   │   ├── home
│   │   │   │   ├── home.ts
│   │   │   │   ├── home.html
│   │   │   │   └── home.css
│   │   │   │
│   │   │   ├── login
│   │   │   │   ├── login.ts
│   │   │   │   ├── login.html
│   │   │   │   └── login.css
│   │   │   │
│   │   │   └── members
│   │   │       ├── members.ts
│   │   │       ├── members.html
│   │   │       └── members.css
│   │   │
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── app.ts
│   │   ├── app.html
│   │   └── app.css
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.css
│
├── angular.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md


## Projekt installieren ##

Nach dem Klonen des Repositorys müssen zuerst die benötigten Pakete installiert werden.

npm install
Anwendung starten

Die Anwendung kann mit folgendem Befehl gestartet werden:

npm start

Unter Windows kann alternativ verwendet werden:

npm.cmd run start

Danach ist die Anwendung normalerweise erreichbar unter:

http://localhost:4200/

## Startseite ##

- Moderne Fitnessstudio-Startseite
- Navigation zum Login
- Responsive Design


## Sicherheit ##

Die Route zur Mitgliederverwaltung wird durch einen Angular Route Guard geschützt.

Zusätzlich wird der Login-Status mit sessionStorage gespeichert.

Nach dem Logout wird der Login-Status entfernt und der Benutzer wieder zum Login weitergeleitet.

## Login ##

Die Mitgliederverwaltung ist durch einen Login geschützt.

Test-Zugang:

Benutzername: admin
Passwort: 1234



## Autor ##

Schulvorzeigeprojekt im Bereich Frontend Development.

Projekt:

Fitness-Studio WORKOUT