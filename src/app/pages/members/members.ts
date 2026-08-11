import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  ViewEncapsulation
} from '@angular/core';

import { Router } from '@angular/router';

type Tariff = 'Basic' | 'Premium' | 'VIP';
type PaymentStatus = 'Bezahlt' | 'Offen' | 'Überfällig';

interface Member {
  id: string | number;
  memberNumber: string;
  entryDate: string;
  name: string;
  email: string;
  phone: string;
  website: string;

  address: {
    city: string;
  };

  company: {
    name: string;
  };

  trainingPlan: string;
  paymentStatus: PaymentStatus;
  tariff: Tariff;
  monthlyFee: number;
}

interface Course {
  id: string | number;
  name: string;
  day: string;
  time: string;
  trainer: string;
  capacity: number;
  spots: number;
}

interface Booking {
  id: string | number;
  courseId: string | number;
  courseName: string;
  courseDay: string;
  courseTime: string;
  memberId: string | number;
  memberName: string;
  createdAt: string;
}

interface MemberFormValues {
  name: string;
  email: string;
  phone: string;
  city: string;
  company: string;
  entryDate: string;
  trainingPlan: string;
  paymentStatus: string;
  tariff: string;
  monthlyFee: number;
}

interface CourseFormValues {
  name: string;
  day: string;
  time: string;
  trainer: string;
  capacity: number;
}

interface ChartItem {
  label: string;
  value: number;
  maximum: number;
  valueText: string;
  className: string;
}

@Component({
  selector: 'app-members',
  imports: [],
  templateUrl: './members.html',
  styleUrl: './members.css',

  /*
    Wichtig:
    Deine Mitglieder und Kurse werden teilweise per TypeScript
    dynamisch erzeugt.

    Deshalb verwenden wir ViewEncapsulation.None, damit auch
    diese dynamisch erzeugten Elemente das CSS bekommen.
  */
  encapsulation: ViewEncapsulation.None
})
export class Members implements AfterViewInit {

  @HostBinding('style.display')
  hostDisplay = 'block';

  @HostBinding('style.minHeight')
  hostMinHeight = '100vh';

  @HostBinding('style.color')
  hostColor = 'white';

  @HostBinding('style.fontFamily')
  hostFontFamily = 'Arial, sans-serif';

  @HostBinding('style.backgroundImage')
  hostBackgroundImage =
    'linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.75)), url("/assets/images/workout.webp")';

  @HostBinding('style.backgroundSize')
  hostBackgroundSize = 'cover';

  @HostBinding('style.backgroundPosition')
  hostBackgroundPosition = 'center';

  @HostBinding('style.backgroundRepeat')
  hostBackgroundRepeat = 'no-repeat';

  @HostBinding('style.backgroundAttachment')
  hostBackgroundAttachment = 'fixed';


  private readonly membersListAPIUrl =
    'https://jsonplaceholder.typicode.com/users';

  private readonly localStorageKey = 'workoutMembers';

  private readonly courseStorageKey = 'workoutCourses';

  private readonly bookingStorageKey = 'workoutBookings';


  private readonly trainingPlans = [
    'Ganzkörpertraining',
    'Muskelaufbau',
    'Ausdauer & Cardio',
    'Gewichtsreduktion',
    'Personal Training'
  ];


  private readonly paymentStatuses: PaymentStatus[] = [
    'Bezahlt',
    'Offen',
    'Überfällig'
  ];


  private readonly tariffs: Tariff[] = [
    'Basic',
    'Premium',
    'VIP'
  ];


  private readonly tariffPrices: Record<Tariff, number> = {
    Basic: 29.9,
    Premium: 49.9,
    VIP: 79.9
  };


  private readonly defaultCourses: Course[] = [
    {
      id: 1,
      name: 'HIIT Power',
      day: 'Montag',
      time: '18:00 Uhr',
      trainer: 'Max',
      capacity: 12,
      spots: 12
    },

    {
      id: 2,
      name: 'Yoga Flow',
      day: 'Dienstag',
      time: '17:30 Uhr',
      trainer: 'Laura',
      capacity: 10,
      spots: 10
    },

    {
      id: 3,
      name: 'Boxtraining',
      day: 'Mittwoch',
      time: '19:00 Uhr',
      trainer: 'Can',
      capacity: 14,
      spots: 14
    },

    {
      id: 4,
      name: 'Rückenfit',
      day: 'Donnerstag',
      time: '16:30 Uhr',
      trainer: 'Sophie',
      capacity: 8,
      spots: 8
    },

    {
      id: 5,
      name: 'Spinning',
      day: 'Freitag',
      time: '18:30 Uhr',
      trainer: 'Daniel',
      capacity: 15,
      spots: 15
    },

    {
      id: 6,
      name: 'Personal Strength',
      day: 'Samstag',
      time: '11:00 Uhr',
      trainer: 'Mia',
      capacity: 6,
      spots: 6
    }
  ];


  private allMembers: Member[] = [];

  private workoutCourses: Course[] = [];

  private workoutBookings: Booking[] = [];


  private editingMemberId: string | number | null = null;

  private deletingMemberId: string | number | null = null;

  private selectedCourseId: string | number | null = null;

  private editingCourseId: string | number | null = null;

  private deletingCourseId: string | number | null = null;

  private selectedMemberForPrint: Member | null = null;


  private currentPage = 1;

  private membersPerPage = 5;

  private sortAscending = true;

  private toastTimer: ReturnType<typeof setTimeout> | null = null;


  constructor(
    private router: Router,
    private host: ElementRef<HTMLElement>
  ) {}


  ngAfterViewInit(): void {

    if (
      sessionStorage.getItem('workoutLoggedIn') !== 'true'
    ) {

      void this.router.navigate(['/login']);

      return;
    }


    this.configureFormDefaults();

    this.registerModalButtons();

    this.registerEventListeners();

    void this.initializeApplication();
  }


  private async initializeApplication(): Promise<void> {

    this.workoutBookings =
      this.loadBookingsFromStorage();

    this.workoutCourses =
      this.loadCoursesFromStorage();

    this.recalculateCourseSpots();


    this.allMembers =
      await this.loadMembers();

    this.allMembers =
      this.ensureUniqueMemberNumbers(
        this.allMembers
      );


    this.saveAllData();

    this.refreshAllViews(true);
  }


  /*
  ============================
  DOM HILFSFUNKTIONEN
  ============================
  */

  private el<T extends HTMLElement>(
    id: string
  ): T {

    const element =
      document.getElementById(id);

    if (!element) {

      throw new Error(
        `HTML-Element #${id} wurde nicht gefunden.`
      );
    }

    return element as T;
  }


  private query<T extends Element>(
    root: ParentNode,
    selector: string
  ): T {

    const element =
      root.querySelector(selector);

    if (!element) {

      throw new Error(
        `Element ${selector} wurde nicht gefunden.`
      );
    }

    return element as T;
  }


  /*
  ============================
  FORMULAR STANDARDWERTE
  ============================
  */

  private configureFormDefaults(): void {

    const today =
      this.getTodayISO();


    const newEntryDateInput =
      this.el<HTMLInputElement>(
        'new-entry-date'
      );

    const editEntryDateInput =
      this.el<HTMLInputElement>(
        'edit-entry-date'
      );


    newEntryDateInput.value = today;

    newEntryDateInput.max = today;

    editEntryDateInput.max = today;


    const tariffInput =
      this.el<HTMLSelectElement>(
        'new-tariff'
      );

    tariffInput.value = 'Basic';


    this.el<HTMLInputElement>(
      'new-monthly-fee'
    ).value =
      this.tariffPrices.Basic.toFixed(2);
  }


  /*
  ============================
  EVENT LISTENER
  ============================
  */

  private registerEventListeners(): void {

    const searchInput =
      this.el<HTMLInputElement>(
        'member-search'
      );

    const paymentFilter =
      this.el<HTMLSelectElement>(
        'payment-filter'
      );

    const trainingFilter =
      this.el<HTMLSelectElement>(
        'training-filter'
      );

    const tariffFilter =
      this.el<HTMLSelectElement>(
        'tariff-filter'
      );


    searchInput.addEventListener(
      'input',
      () => this.applyMemberFilters(true)
    );


    paymentFilter.addEventListener(
      'change',
      () => this.applyMemberFilters(true)
    );


    trainingFilter.addEventListener(
      'change',
      () => this.applyMemberFilters(true)
    );


    tariffFilter.addEventListener(
      'change',
      () => this.applyMemberFilters(true)
    );


    this.el<HTMLButtonElement>(
      'clear-filters-button'
    ).addEventListener(
      'click',
      () => this.clearMemberFilters()
    );


    this.el<HTMLButtonElement>(
      'export-members-button'
    ).addEventListener(
      'click',
      () => this.exportMembersAsCSV()
    );


    this.el<HTMLButtonElement>(
      'backup-data-button'
    ).addEventListener(
      'click',
      () => this.exportBackupAsJSON()
    );


    this.el<HTMLButtonElement>(
      'import-data-button'
    ).addEventListener(
      'click',
      () => {

        this.el<HTMLInputElement>(
          'import-data-input'
        ).click();

      }
    );


    this.el<HTMLInputElement>(
      'import-data-input'
    ).addEventListener(
      'change',
      (event) =>
        void this.importBackupFromJSON(event)
    );


    this.el<HTMLSelectElement>(
      'members-per-page'
    ).addEventListener(
      'change',
      (event) => {

        const select =
          event.target as HTMLSelectElement;

        this.membersPerPage =
          Number(select.value);

        this.currentPage = 1;

        this.applyMemberFilters(false);
      }
    );


    this.el<HTMLButtonElement>(
      'previous-page-button'
    ).addEventListener(
      'click',
      () => this.changePage(-1)
    );


    this.el<HTMLButtonElement>(
      'next-page-button'
    ).addEventListener(
      'click',
      () => this.changePage(1)
    );


    this.el<HTMLButtonElement>(
      'sort-name-button'
    ).addEventListener(
      'click',
      () => this.sortMembersByName()
    );


    this.el<HTMLButtonElement>(
      'reset-button'
    ).addEventListener(
      'click',
      () => this.openModal('resetModal')
    );


    this.el<HTMLButtonElement>(
      'confirm-reset-button'
    ).addEventListener(
      'click',
      () => void this.resetAllData()
    );


    this.el<HTMLButtonElement>(
      'logout-button'
    ).addEventListener(
      'click',
      () => this.logout()
    );


    this.el<HTMLFormElement>(
      'add-member-form'
    ).addEventListener(
      'submit',
      (event) => this.addMember(event)
    );


    this.el<HTMLFormElement>(
      'edit-member-form'
    ).addEventListener(
      'submit',
      (event) => this.editMember(event)
    );


    this.el<HTMLButtonElement>(
      'confirm-delete-button'
    ).addEventListener(
      'click',
      () => this.deleteMember()
    );


    this.el<HTMLSelectElement>(
      'new-tariff'
    ).addEventListener(
      'change',
      (event) => {

        const tariff =
          (event.target as HTMLSelectElement)
            .value as Tariff;


        this.el<HTMLInputElement>(
          'new-monthly-fee'
        ).value =
          this.tariffPrices[tariff]
            .toFixed(2);
      }
    );


    this.el<HTMLSelectElement>(
      'edit-tariff'
    ).addEventListener(
      'change',
      (event) => {

        const tariff =
          (event.target as HTMLSelectElement)
            .value as Tariff;


        this.el<HTMLInputElement>(
          'edit-monthly-fee'
        ).value =
          this.tariffPrices[tariff]
            .toFixed(2);
      }
    );


    this.el<HTMLFormElement>(
      'add-course-form'
    ).addEventListener(
      'submit',
      (event) => this.addCourse(event)
    );


    this.el<HTMLFormElement>(
      'edit-course-form'
    ).addEventListener(
      'submit',
      (event) => this.editCourse(event)
    );


    this.el<HTMLButtonElement>(
      'confirm-delete-course-button'
    ).addEventListener(
      'click',
      () => this.deleteCourse()
    );


    this.el<HTMLFormElement>(
      'course-booking-form'
    ).addEventListener(
      'submit',
      (event) => this.bookCourse(event)
    );


    this.el<HTMLInputElement>(
      'booking-search'
    ).addEventListener(
      'input',
      () => this.showBookings()
    );


    this.el<HTMLSelectElement>(
      'booking-course-filter'
    ).addEventListener(
      'change',
      () => this.showBookings()
    );


    this.el<HTMLButtonElement>(
      'clear-booking-filters-button'
    ).addEventListener(
      'click',
      () => this.clearBookingFilters()
    );


    this.el<HTMLButtonElement>(
      'print-member-button'
    ).addEventListener(
      'click',
      () => this.printSelectedMember()
    );


    this.el<HTMLButtonElement>(
      'print-courses-button'
    ).addEventListener(
      'click',
      () => this.printCourseList()
    );
  }


  /*
  ============================
  MODAL BUTTONS
  ============================
  */

  private registerModalButtons(): void {

    const root =
      this.host.nativeElement;


    root
      .querySelectorAll<HTMLElement>(
        '[data-bs-toggle="modal"][data-bs-target]'
      )
      .forEach((button) => {

        button.addEventListener(
          'click',
          (event) => {

            event.preventDefault();

            const target =
              button.getAttribute(
                'data-bs-target'
              );

            if (
              target &&
              target.startsWith('#')
            ) {

              this.openModal(
                target.substring(1)
              );
            }
          }
        );
      });


    root
      .querySelectorAll<HTMLElement>(
        '[data-bs-dismiss="modal"]'
      )
      .forEach((button) => {

        button.addEventListener(
          'click',
          () => {

            const modal =
              button.closest(
                '.modal'
              ) as HTMLElement | null;


            if (modal?.id) {

              this.closeModal(
                modal.id
              );
            }
          }
        );
      });
  }


  /*
  ============================
  DATEN LADEN
  ============================
  */

  private async loadMembers(): Promise<Member[]> {

    const savedMembers =
      this.readJSON(
        this.localStorageKey
      );


    if (
      Array.isArray(savedMembers)
    ) {

      return savedMembers.map(
        (member, index) =>
          this.normalizeMember(
            member,
            index
          )
      );
    }


    const listGroup =
      this.el<HTMLUListElement>(
        'list-group'
      );


    listGroup.innerHTML = `
      <li class="member-row empty-row">
        <div class="member-name">
          Mitglieder werden geladen...
        </div>
      </li>
    `;


    try {

      const response =
        await fetch(
          this.membersListAPIUrl
        );


      if (!response.ok) {

        throw new Error(
          `HTTP-Fehler: ${response.status}`
        );
      }


      const members =
        await response.json();


      this.showToast(
        'Mitglieder wurden erfolgreich geladen.',
        'success'
      );


      return members.map(
        (member: any, index: number) =>
          this.normalizeMember(
            member,
            index
          )
      );

    } catch (error) {

      console.error(
        'Mitglieder konnten nicht geladen werden:',
        error
      );


      this.showToast(
        'Mitglieder konnten nicht geladen werden.',
        'error'
      );


      return [];
    }
  }


  private loadCoursesFromStorage(): Course[] {

    const savedCourses =
      this.readJSON(
        this.courseStorageKey
      );


    const source =
      Array.isArray(savedCourses)
        ? savedCourses
        : this.createDefaultCourses();


    return source.map(
      (course, index) =>
        this.normalizeCourse(
          course,
          index
        )
    );
  }


  private loadBookingsFromStorage(): Booking[] {

    const savedBookings =
      this.readJSON(
        this.bookingStorageKey
      );


    if (
      !Array.isArray(savedBookings)
    ) {

      return [];
    }


    return savedBookings
      .map((booking) =>
        this.normalizeBooking(
          booking
        )
      )
      .filter(
        (booking):
          booking is Booking =>
            booking !== null
      );
  }


  private saveAllData(): void {

    localStorage.setItem(
      this.localStorageKey,
      JSON.stringify(
        this.allMembers
      )
    );


    localStorage.setItem(
      this.courseStorageKey,
      JSON.stringify(
        this.workoutCourses
      )
    );


    localStorage.setItem(
      this.bookingStorageKey,
      JSON.stringify(
        this.workoutBookings
      )
    );
  }


  private readJSON(
    key: string
  ): any {

    const value =
      localStorage.getItem(key);


    if (!value) {

      return null;
    }


    try {

      return JSON.parse(value);

    } catch (error) {

      console.error(
        `Fehlerhafte Daten unter ${key}:`,
        error
      );


      localStorage.removeItem(key);

      return null;
    }
  }


  /*
  ============================
  NORMALISIERUNG
  ============================
  */

  private normalizeMember(
    member: any,
    index: number
  ): Member {

    const tariff: Tariff =
      this.tariffs.includes(
        member.tariff
      )
        ? member.tariff
        : this.tariffs[
            index %
            this.tariffs.length
          ];


    const monthlyFee =
      Number(member.monthlyFee);


    return {

      id:
        member.id ??
        this.generateId(),

      memberNumber:
        String(
          member.memberNumber || ''
        ).trim(),

      entryDate:
        this.isValidISODate(
          member.entryDate
        )
          ? member.entryDate
          : this.createDefaultEntryDate(
              index
            ),

      name:
        String(
          member.name ||
          'Unbekanntes Mitglied'
        ).trim(),

      email:
        String(
          member.email ||
          'Keine E-Mail angegeben'
        ).trim(),

      phone:
        String(
          member.phone ||
          'Keine Telefonnummer angegeben'
        ).trim(),

      website:
        String(
          member.website ||
          'Keine Website angegeben'
        ).trim(),

      address: {

        city:
          String(
            member.address?.city ||
            'Keine Stadt angegeben'
          ).trim()
      },

      company: {

        name:
          String(
            member.company?.name ||
            'Keine Firma angegeben'
          ).trim()
      },

      trainingPlan:
        this.trainingPlans.includes(
          member.trainingPlan
        )
          ? member.trainingPlan
          : this.trainingPlans[
              index %
              this.trainingPlans.length
            ],

      paymentStatus:
        this.paymentStatuses.includes(
          member.paymentStatus
        )
          ? member.paymentStatus
          : this.paymentStatuses[
              index %
              this.paymentStatuses.length
            ],

      tariff,

      monthlyFee:
        Number.isFinite(monthlyFee) &&
        monthlyFee >= 0
          ? monthlyFee
          : this.tariffPrices[tariff]
    };
  }


  private normalizeCourse(
    course: any,
    index: number
  ): Course {

    const courseId =
      course.id ??
      this.generateId();


    const bookingAmount =
      this.countBookingsForCourse(
        courseId
      );


    const savedCapacity =
      Number(course.capacity);

    const savedSpots =
      Number(course.spots);


    let capacity: number;


    if (
      Number.isFinite(
        savedCapacity
      ) &&
      savedCapacity >= 1
    ) {

      capacity =
        Math.max(
          savedCapacity,
          bookingAmount
        );

    } else if (
      Number.isFinite(
        savedSpots
      ) &&
      savedSpots >= 0
    ) {

      capacity =
        Math.max(
          savedSpots +
          bookingAmount,
          1
        );

    } else {

      capacity = 10;
    }


    return {

      id: courseId,

      name:
        String(
          course.name ||
          `Kurs ${index + 1}`
        ).trim(),

      day:
        String(
          course.day ||
          'Montag'
        ).trim(),

      time:
        this.normalizeClockTime(
          course.time ||
          '12:00 Uhr'
        ),

      trainer:
        String(
          course.trainer ||
          'Kein Trainer'
        ).trim(),

      capacity,

      spots:
        Math.max(
          0,
          capacity -
          bookingAmount
        )
    };
  }


  private normalizeBooking(
    booking: any
  ): Booking | null {

    if (
      !booking ||
      booking.courseId == null ||
      booking.memberId == null
    ) {

      return null;
    }


    return {

      id:
        booking.id ??
        this.generateId(),

      courseId:
        booking.courseId,

      courseName:
        String(
          booking.courseName ||
          'Unbekannter Kurs'
        ),

      courseDay:
        String(
          booking.courseDay ||
          ''
        ),

      courseTime:
        String(
          booking.courseTime ||
          ''
        ),

      memberId:
        booking.memberId,

      memberName:
        String(
          booking.memberName ||
          'Unbekanntes Mitglied'
        ),

      createdAt:
        String(
          booking.createdAt ||
          new Date()
            .toLocaleString(
              'de-DE'
            )
        )
    };
  }


  private createDefaultCourses(): Course[] {

    return this.defaultCourses.map(
      (course) => ({
        ...course
      })
    );
  }


  /*
  ============================
  ALLE ANSICHTEN
  ============================
  */

  private refreshAllViews(
    resetPage = false
  ): void {

    if (resetPage) {

      this.currentPage = 1;
    }


    this.applyMemberFilters(false);

    this.showCourses();

    this.refreshBookingCourseFilter();

    this.showBookings();

    this.updateDashboard();

    this.renderStatistics();
  }


  /*
  ============================
  DASHBOARD
  ============================
  */

  private updateDashboard(): void {

    const cities =
      new Set(
        this.allMembers.map(
          (member) =>
            member.address.city
        )
      );


    const plans =
      new Set(
        this.allMembers.map(
          (member) =>
            member.trainingPlan
        )
      );


    const openPayments =
      this.allMembers.filter(
        (member) =>
          member.paymentStatus !==
          'Bezahlt'
      );


    this.el<HTMLElement>(
      'dashboard-members'
    ).textContent =
      String(
        this.allMembers.length
      );


    this.el<HTMLElement>(
      'dashboard-cities'
    ).textContent =
      String(cities.size);


    this.el<HTMLElement>(
      'dashboard-plans'
    ).textContent =
      String(plans.size);


    this.el<HTMLElement>(
      'dashboard-payments'
    ).textContent =
      String(
        openPayments.length
      );


    this.el<HTMLElement>(
      'dashboard-bookings'
    ).textContent =
      String(
        this.workoutBookings.length
      );
  }


  /*
  ============================
  MITGLIEDER FILTER
  ============================
  */

  private getFilteredMembers(): Member[] {

    const searchValue =
      this.el<HTMLInputElement>(
        'member-search'
      )
        .value
        .trim()
        .toLowerCase();


    const selectedPayment =
      this.el<HTMLSelectElement>(
        'payment-filter'
      ).value;


    const selectedTrainingPlan =
      this.el<HTMLSelectElement>(
        'training-filter'
      ).value;


    const selectedTariff =
      this.el<HTMLSelectElement>(
        'tariff-filter'
      ).value;


    return this.allMembers.filter(
      (member) => {

        const searchableValues = [

          member.memberNumber,

          member.name,

          member.email,

          member.phone,

          member.address.city,

          member.company.name,

          member.trainingPlan,

          member.paymentStatus,

          member.tariff,

          member.monthlyFee,

          member.entryDate
        ];


        const matchesSearch =
          searchableValues.some(
            (value) =>
              String(value)
                .toLowerCase()
                .includes(
                  searchValue
                )
          );


        const matchesPayment =
          selectedPayment === 'Alle' ||
          member.paymentStatus ===
            selectedPayment;


        const matchesTraining =
          selectedTrainingPlan ===
            'Alle' ||
          member.trainingPlan ===
            selectedTrainingPlan;


        const matchesTariff =
          selectedTariff === 'Alle' ||
          member.tariff ===
            selectedTariff;


        return (
          matchesSearch &&
          matchesPayment &&
          matchesTraining &&
          matchesTariff
        );
      }
    );
  }


  private applyMemberFilters(
    resetPage = false
  ): void {

    if (resetPage) {

      this.currentPage = 1;
    }


    this.renderMembers(
      this.getFilteredMembers()
    );
  }


  /*
  ============================
  MITGLIEDER ANZEIGEN
  ============================
  */

  private renderMembers(
    filteredMembers: Member[]
  ): void {

    const listGroup =
      this.el<HTMLUListElement>(
        'list-group'
      );


    listGroup.innerHTML = '';


    const totalPages =
      Math.max(
        1,

        Math.ceil(
          filteredMembers.length /
          this.membersPerPage
        )
      );


    if (
      this.currentPage >
      totalPages
    ) {

      this.currentPage =
        totalPages;
    }


    const startIndex =
      (this.currentPage - 1) *
      this.membersPerPage;


    const visibleMembers =
      filteredMembers.slice(
        startIndex,
        startIndex +
        this.membersPerPage
      );


    this.el<HTMLElement>(
      'member-count'
    ).textContent =
      `${filteredMembers.length} von ` +
      `${this.allMembers.length} Mitglieder`;


    if (
      visibleMembers.length === 0
    ) {

      listGroup.innerHTML = `
        <li class="member-row empty-row">

          <div class="member-name">
            Kein Mitglied gefunden
          </div>

        </li>
      `;

    } else {

      visibleMembers.forEach(
        (member) => {

          const listElement =
            document.createElement(
              'li'
            );


          listElement.className =
            'member-row';


          listElement.innerHTML = `

            <div>

              <div class="member-number">
                ${this.escapeHTML(
                  member.memberNumber
                )}
              </div>

              <div class="member-name">
                ${this.escapeHTML(
                  member.name
                )}
              </div>

            </div>


            <div class="member-email">
              ${this.escapeHTML(
                member.email
              )}
            </div>


            <div class="member-plan">
              ${this.escapeHTML(
                member.trainingPlan
              )}
            </div>


            <div
              class="member-tariff
              ${this.getTariffClass(
                member.tariff
              )}"
            >

              ${this.escapeHTML(
                member.tariff
              )}

              ·

              ${this.formatCurrency(
                member.monthlyFee
              )}

            </div>


            <div
              class="payment-badge
              ${this.getPaymentClass(
                member.paymentStatus
              )}"
            >

              ${this.escapeHTML(
                member.paymentStatus
              )}

            </div>


            <div class="member-actions">

              <button
                type="button"
                class="btn-detail"
              >
                Detail
              </button>


              <button
                type="button"
                class="btn-edit"
              >
                Bearbeiten
              </button>


              <button
                type="button"
                class="btn-delete"
              >
                Löschen
              </button>

            </div>
          `;


          this.query<HTMLButtonElement>(
            listElement,
            '.btn-detail'
          ).addEventListener(
            'click',
            () =>
              this.showMemberDetails(
                member
              )
          );


          this.query<HTMLButtonElement>(
            listElement,
            '.btn-edit'
          ).addEventListener(
            'click',
            () =>
              this.openEditMemberModal(
                member
              )
          );


          this.query<HTMLButtonElement>(
            listElement,
            '.btn-delete'
          ).addEventListener(
            'click',
            () =>
              this.openDeleteMemberModal(
                member
              )
          );


          listGroup.appendChild(
            listElement
          );
        }
      );
    }


    this.renderPagination(
      filteredMembers.length,
      totalPages
    );
  }


  /*
  ============================
  PAGINATION
  ============================
  */

  private renderPagination(
    totalItems: number,
    totalPages: number
  ): void {

    const paginationPages =
      this.el<HTMLElement>(
        'pagination-pages'
      );


    paginationPages.innerHTML = '';


    for (
      let page = 1;
      page <= totalPages;
      page += 1
    ) {

      const pageButton =
        document.createElement(
          'button'
        );


      pageButton.type =
        'button';


      pageButton.className =
        'pagination-page-button';


      pageButton.textContent =
        String(page);


      if (
        page ===
        this.currentPage
      ) {

        pageButton.classList.add(
          'active'
        );


        pageButton.setAttribute(
          'aria-current',
          'page'
        );
      }


      pageButton.addEventListener(
        'click',
        () => {

          this.currentPage =
            page;


          this.applyMemberFilters(
            false
          );


          this.el<HTMLElement>(
            'members-area'
          ).scrollIntoView({

            behavior: 'smooth',

            block: 'start'
          });
        }
      );


      paginationPages.appendChild(
        pageButton
      );
    }


    this.el<HTMLButtonElement>(
      'previous-page-button'
    ).disabled =
      this.currentPage <= 1 ||
      totalItems === 0;


    this.el<HTMLButtonElement>(
      'next-page-button'
    ).disabled =
      this.currentPage >=
        totalPages ||
      totalItems === 0;
  }


  private changePage(
    direction: number
  ): void {

    const filteredMembers =
      this.getFilteredMembers();


    const totalPages =
      Math.max(
        1,

        Math.ceil(
          filteredMembers.length /
          this.membersPerPage
        )
      );


    const targetPage =
      this.currentPage +
      direction;


    if (
      targetPage < 1 ||
      targetPage > totalPages
    ) {

      return;
    }


    this.currentPage =
      targetPage;


    this.renderMembers(
      filteredMembers
    );
  }


  private clearMemberFilters(): void {

    this.clearMemberFiltersWithoutToast();


    this.applyMemberFilters(false);


    this.showToast(
      'Suche und Filter wurden zurückgesetzt.',
      'success'
    );
  }


  private sortMembersByName(): void {

    this.allMembers.sort(
      (memberA, memberB) => {

        const result =
          memberA.name.localeCompare(
            memberB.name,
            'de'
          );


        return this.sortAscending
          ? result
          : -result;
      }
    );


    this.sortAscending =
      !this.sortAscending;


    this.el<HTMLButtonElement>(
      'sort-name-button'
    ).textContent =
      this.sortAscending
        ? 'Name A–Z'
        : 'Name Z–A';


    this.saveAllData();

    this.applyMemberFilters(true);


    this.showToast(
      'Mitglieder wurden sortiert.',
      'success'
    );
  }


  /*
  ============================
  MITGLIED HINZUFÜGEN
  ============================
  */

  private addMember(
    event: Event
  ): void {

    event.preventDefault();


    const form =
      this.el<HTMLFormElement>(
        'add-member-form'
      );


    this.clearFormErrors(
      form
    );


    const values: MemberFormValues = {

      name:
        this.el<HTMLInputElement>(
          'new-name'
        ).value.trim(),

      email:
        this.el<HTMLInputElement>(
          'new-email'
        )
          .value
          .trim()
          .toLowerCase(),

      phone:
        this.el<HTMLInputElement>(
          'new-phone'
        ).value.trim(),

      city:
        this.el<HTMLInputElement>(
          'new-city'
        ).value.trim(),

      company:
        this.el<HTMLInputElement>(
          'new-company'
        ).value.trim(),

      entryDate:
        this.el<HTMLInputElement>(
          'new-entry-date'
        ).value,

      trainingPlan:
        this.el<HTMLSelectElement>(
          'new-training-plan'
        ).value,

      paymentStatus:
        this.el<HTMLSelectElement>(
          'new-payment-status'
        ).value,

      tariff:
        this.el<HTMLSelectElement>(
          'new-tariff'
        ).value,

      monthlyFee:
        Number(
          this.el<HTMLInputElement>(
            'new-monthly-fee'
          ).value
        )
    };


    if (
      !this.validateMemberValues(
        values,
        'add'
      )
    ) {

      this.showToast(
        'Bitte korrigiere die markierten Felder.',
        'error'
      );

      return;
    }


    const newMember: Member = {

      id:
        this.generateId(),

      memberNumber:
        this.generateMemberNumber(),

      entryDate:
        values.entryDate,

      name:
        values.name,

      email:
        values.email,

      phone:
        values.phone,

      website:
        'Keine Website angegeben',

      address: {

        city:
          values.city
      },

      company: {

        name:
          values.company
      },

      trainingPlan:
        values.trainingPlan,

      paymentStatus:
        values.paymentStatus as PaymentStatus,

      tariff:
        values.tariff as Tariff,

      monthlyFee:
        values.monthlyFee
    };


    this.allMembers.unshift(
      newMember
    );


    this.saveAllData();


    form.reset();


    this.configureFormDefaults();


    this.closeModal(
      'addMemberModal'
    );


    this.refreshAllViews(true);


    this.showToast(
      `${newMember.name} wurde hinzugefügt.`,
      'success'
    );
  }


  /*
  ============================
  MITGLIED BEARBEITEN
  ============================
  */

  private openEditMemberModal(
    member: Member
  ): void {

    this.editingMemberId =
      member.id;


    const form =
      this.el<HTMLFormElement>(
        'edit-member-form'
      );


    this.clearFormErrors(
      form
    );


    this.el<HTMLInputElement>(
      'edit-member-number'
    ).value =
      member.memberNumber;


    this.el<HTMLInputElement>(
      'edit-entry-date'
    ).value =
      member.entryDate;


    this.el<HTMLInputElement>(
      'edit-name'
    ).value =
      member.name;


    this.el<HTMLInputElement>(
      'edit-email'
    ).value =
      member.email;


    this.el<HTMLInputElement>(
      'edit-phone'
    ).value =
      member.phone;


    this.el<HTMLInputElement>(
      'edit-city'
    ).value =
      member.address.city;


    this.el<HTMLInputElement>(
      'edit-company'
    ).value =
      member.company.name;


    this.el<HTMLSelectElement>(
      'edit-training-plan'
    ).value =
      member.trainingPlan;


    this.el<HTMLSelectElement>(
      'edit-payment-status'
    ).value =
      member.paymentStatus;


    this.el<HTMLSelectElement>(
      'edit-tariff'
    ).value =
      member.tariff;


    this.el<HTMLInputElement>(
      'edit-monthly-fee'
    ).value =
      Number(
        member.monthlyFee
      ).toFixed(2);


    this.openModal(
      'editMemberModal'
    );
  }


  private editMember(
    event: Event
  ): void {

    event.preventDefault();


    const form =
      this.el<HTMLFormElement>(
        'edit-member-form'
      );


    this.clearFormErrors(
      form
    );


    const values: MemberFormValues = {

      name:
        this.el<HTMLInputElement>(
          'edit-name'
        ).value.trim(),

      email:
        this.el<HTMLInputElement>(
          'edit-email'
        )
          .value
          .trim()
          .toLowerCase(),

      phone:
        this.el<HTMLInputElement>(
          'edit-phone'
        ).value.trim(),

      city:
        this.el<HTMLInputElement>(
          'edit-city'
        ).value.trim(),

      company:
        this.el<HTMLInputElement>(
          'edit-company'
        ).value.trim(),

      entryDate:
        this.el<HTMLInputElement>(
          'edit-entry-date'
        ).value,

      trainingPlan:
        this.el<HTMLSelectElement>(
          'edit-training-plan'
        ).value,

      paymentStatus:
        this.el<HTMLSelectElement>(
          'edit-payment-status'
        ).value,

      tariff:
        this.el<HTMLSelectElement>(
          'edit-tariff'
        ).value,

      monthlyFee:
        Number(
          this.el<HTMLInputElement>(
            'edit-monthly-fee'
          ).value
        )
    };


    if (
      !this.validateMemberValues(
        values,
        'edit'
      )
    ) {

      this.showToast(
        'Bitte korrigiere die markierten Felder.',
        'error'
      );

      return;
    }


    let editedMember:
      Member | null = null;


    this.allMembers =
      this.allMembers.map(
        (member) => {

          if (
            !this.sameId(
              member.id,
              this.editingMemberId
            )
          ) {

            return member;
          }


          const updatedMember: Member = {

            ...member,

            entryDate:
              values.entryDate,

            name:
              values.name,

            email:
              values.email,

            phone:
              values.phone,

            address: {

              ...member.address,

              city:
                values.city
            },

            company: {

              ...member.company,

              name:
                values.company
            },

            trainingPlan:
              values.trainingPlan,

            paymentStatus:
              values.paymentStatus as PaymentStatus,

            tariff:
              values.tariff as Tariff,

            monthlyFee:
              values.monthlyFee
          };


          editedMember =
            updatedMember;


          return updatedMember;
        }
      );


    if (editedMember) {

      const changedMember =
        editedMember as Member;


      this.workoutBookings =
        this.workoutBookings.map(
          (booking) =>

            this.sameId(
              booking.memberId,
              this.editingMemberId
            )

              ? {

                  ...booking,

                  memberName:
                    changedMember.name
                }

              : booking
        );
    }


    this.saveAllData();


    this.closeModal(
      'editMemberModal'
    );


    this.editingMemberId =
      null;


    this.refreshAllViews(false);


    this.showToast(
      'Mitglied wurde bearbeitet.',
      'success'
    );
  }


  /*
  ============================
  MITGLIED VALIDIERUNG
  ============================
  */

  private validateMemberValues(
    values: MemberFormValues,
    mode: 'add' | 'edit'
  ): boolean {

    let valid = true;


    const prefix =
      mode === 'add'
        ? 'new'
        : 'edit';


    const requiredFields = [

      {
        value: values.name,
        input: `${prefix}-name`,
        error: `${prefix}-name-error`
      },

      {
        value: values.email,
        input: `${prefix}-email`,
        error: `${prefix}-email-error`
      },

      {
        value: values.phone,
        input: `${prefix}-phone`,
        error: `${prefix}-phone-error`
      },

      {
        value: values.city,
        input: `${prefix}-city`,
        error: `${prefix}-city-error`
      },

      {
        value: values.company,
        input: `${prefix}-company`,
        error: `${prefix}-company-error`
      },

      {
        value: values.entryDate,
        input: `${prefix}-entry-date`,
        error: `${prefix}-entry-date-error`
      }
    ];


    requiredFields.forEach(
      (field) => {

        if (
          !String(
            field.value || ''
          ).trim()
        ) {

          this.setFieldError(
            this.el<HTMLInputElement>(
              field.input
            ),
            field.error,
            'Pflichtfeld'
          );


          valid = false;
        }
      }
    );


    if (
      values.email &&
      !this.isValidEmail(
        values.email
      )
    ) {

      this.setFieldError(
        this.el<HTMLInputElement>(
          `${prefix}-email`
        ),
        `${prefix}-email-error`,
        'Ungültige E-Mail-Adresse'
      );


      valid = false;
    }


    const duplicateEmail =
      this.allMembers.some(
        (member) => {

          const sameEmail =
            member.email
              .toLowerCase() ===
            values.email
              .toLowerCase();


          const isCurrentMember =
            mode === 'edit' &&
            this.sameId(
              member.id,
              this.editingMemberId
            );


          return (
            sameEmail &&
            !isCurrentMember
          );
        }
      );


    if (duplicateEmail) {

      this.setFieldError(
        this.el<HTMLInputElement>(
          `${prefix}-email`
        ),
        `${prefix}-email-error`,
        'Diese E-Mail-Adresse ist bereits vorhanden'
      );


      valid = false;
    }


    if (
      values.entryDate &&
      values.entryDate >
        this.getTodayISO()
    ) {

      this.setFieldError(
        this.el<HTMLInputElement>(
          `${prefix}-entry-date`
        ),
        `${prefix}-entry-date-error`,
        'Das Eintrittsdatum darf nicht in der Zukunft liegen'
      );


      valid = false;
    }


    if (
      !Number.isFinite(
        values.monthlyFee
      ) ||
      values.monthlyFee <= 0
    ) {

      this.setFieldError(
        this.el<HTMLInputElement>(
          `${prefix}-monthly-fee`
        ),
        `${prefix}-monthly-fee-error`,
        'Der Monatsbeitrag muss größer als 0 sein'
      );


      valid = false;
    }


    return valid;
  }


  /*
  ============================
  MITGLIED DETAILS
  ============================
  */

  private showMemberDetails(
    member: Member
  ): void {

    this.selectedMemberForPrint =
      member;


    this.el<HTMLElement>(
      'modal-name'
    ).textContent =
      member.name;


    this.el<HTMLElement>(
      'modal-member-number'
    ).textContent =
      member.memberNumber;


    this.el<HTMLElement>(
      'modal-entry-date'
    ).textContent =
      this.formatDateDE(
        member.entryDate
      );


    this.el<HTMLElement>(
      'modal-email'
    ).textContent =
      member.email;


    this.el<HTMLElement>(
      'modal-phone'
    ).textContent =
      member.phone;


    this.el<HTMLElement>(
      'modal-website'
    ).textContent =
      member.website;


    this.el<HTMLElement>(
      'modal-city'
    ).textContent =
      member.address.city;


    this.el<HTMLElement>(
      'modal-company'
    ).textContent =
      member.company.name;


    this.el<HTMLElement>(
      'modal-tariff'
    ).textContent =
      member.tariff;


    this.el<HTMLElement>(
      'modal-monthly-fee'
    ).textContent =
      this.formatCurrency(
        member.monthlyFee
      );


    this.el<HTMLElement>(
      'modal-training-plan'
    ).textContent =
      member.trainingPlan;


    this.el<HTMLElement>(
      'modal-payment-status'
    ).textContent =
      member.paymentStatus;


    this.openModal(
      'memberModal'
    );
  }


  /*
  ============================
  MITGLIED LÖSCHEN
  ============================
  */

  private openDeleteMemberModal(
    member: Member
  ): void {

    this.deletingMemberId =
      member.id;


    this.el<HTMLElement>(
      'delete-member-name'
    ).textContent =
      member.name;


    this.openModal(
      'deleteMemberModal'
    );
  }


  private deleteMember(): void {

    const deletedMember =
      this.allMembers.find(
        (member) =>
          this.sameId(
            member.id,
            this.deletingMemberId
          )
      );


    this.allMembers =
      this.allMembers.filter(
        (member) =>
          !this.sameId(
            member.id,
            this.deletingMemberId
          )
      );


    this.workoutBookings =
      this.workoutBookings.filter(
        (booking) =>
          !this.sameId(
            booking.memberId,
            this.deletingMemberId
          )
      );


    this.recalculateCourseSpots();

    this.saveAllData();


    this.closeModal(
      'deleteMemberModal'
    );


    this.deletingMemberId =
      null;


    this.refreshAllViews(false);


    this.showToast(
      `${deletedMember?.name || 'Mitglied'} wurde gelöscht.`,
      'success'
    );
  }


  /*
  ============================
  KURSE ANZEIGEN
  ============================
  */

  private showCourses(): void {

    const courseList =
      this.el<HTMLElement>(
        'course-list'
      );


    courseList.innerHTML = '';


    if (
      this.workoutCourses.length === 0
    ) {

      courseList.innerHTML = `

        <article class="course-card">

          <h3>
            Keine Kurse vorhanden
          </h3>

          <p class="course-info">
            Füge einen neuen Kurs hinzu.
          </p>

        </article>
      `;

      return;
    }


    this.workoutCourses.forEach(
      (course) => {

        const bookedSpots =
          Math.max(
            0,

            course.capacity -
            course.spots
          );


        const usage =
          course.capacity > 0
            ? Math.round(
                (
                  bookedSpots /
                  course.capacity
                ) * 100
              )
            : 0;


        const courseElement =
          document.createElement(
            'article'
          );


        courseElement.className =
          'course-card';


        courseElement.innerHTML = `

          <span class="course-day">
            ${this.escapeHTML(
              course.day
            )}
          </span>


          <h3>
            ${this.escapeHTML(
              course.name
            )}
          </h3>


          <p class="course-info">
            Uhrzeit:
            ${this.escapeHTML(
              course.time
            )}
          </p>


          <p class="course-info">
            Trainer:
            ${this.escapeHTML(
              course.trainer
            )}
          </p>


          <p class="course-info">

            Buchungen:

            ${bookedSpots}

            von

            ${course.capacity}

          </p>


          <div
            class="course-progress"
            aria-label="${usage} Prozent ausgelastet"
          >

            <div
              class="course-progress-fill"
              style="width: ${usage}%"
            ></div>

          </div>


          <p class="course-spots">

            ${course.spots}

            freie Plätze

          </p>


          <div class="course-actions">

            <button
              type="button"
              class="btn-book-course"
              ${course.spots === 0
                ? 'disabled'
                : ''}
            >

              ${course.spots === 0
                ? 'Ausgebucht'
                : 'Kurs buchen'}

            </button>


            <button
              type="button"
              class="btn-edit-course"
            >
              Bearbeiten
            </button>


            <button
              type="button"
              class="btn-delete-course"
            >
              Löschen
            </button>

          </div>
        `;


        this.query<HTMLButtonElement>(
          courseElement,
          '.btn-book-course'
        ).addEventListener(
          'click',
          () =>
            this.openCourseBookingModal(
              course
            )
        );


        this.query<HTMLButtonElement>(
          courseElement,
          '.btn-edit-course'
        ).addEventListener(
          'click',
          () =>
            this.openEditCourseModal(
              course
            )
        );


        this.query<HTMLButtonElement>(
          courseElement,
          '.btn-delete-course'
        ).addEventListener(
          'click',
          () =>
            this.openDeleteCourseModal(
              course
            )
        );


        courseList.appendChild(
          courseElement
        );
      }
    );
  }


  /*
  ============================
  KURS HINZUFÜGEN
  ============================
  */

  private addCourse(
    event: Event
  ): void {

    event.preventDefault();


    const form =
      this.el<HTMLFormElement>(
        'add-course-form'
      );


    this.clearFormErrors(
      form
    );


    const values: CourseFormValues = {

      name:
        this.el<HTMLInputElement>(
          'new-course-name'
        ).value.trim(),

      day:
        this.el<HTMLSelectElement>(
          'new-course-day'
        ).value,

      time:
        this.el<HTMLInputElement>(
          'new-course-time'
        ).value,

      trainer:
        this.el<HTMLInputElement>(
          'new-course-trainer'
        ).value.trim(),

      capacity:
        Number(
          this.el<HTMLInputElement>(
            'new-course-capacity'
          ).value
        )
    };


    if (
      !this.validateCourseValues(
        values,
        'add'
      )
    ) {

      this.showToast(
        'Bitte korrigiere die markierten Kursdaten.',
        'error'
      );

      return;
    }


    const newCourse: Course = {

      id:
        this.generateId(),

      name:
        values.name,

      day:
        values.day,

      time:
        this.formatClockTime(
          values.time
        ),

      trainer:
        values.trainer,

      capacity:
        values.capacity,

      spots:
        values.capacity
    };


    this.workoutCourses.push(
      newCourse
    );


    this.saveAllData();


    form.reset();


    this.el<HTMLInputElement>(
      'new-course-capacity'
    ).value =
      '10';


    this.closeModal(
      'addCourseModal'
    );


    this.refreshAllViews(false);


    this.showToast(
      `${newCourse.name} wurde hinzugefügt.`,
      'success'
    );
  }


  /*
  ============================
  KURS BEARBEITEN
  ============================
  */

  private openEditCourseModal(
    course: Course
  ): void {

    this.editingCourseId =
      course.id;


    const form =
      this.el<HTMLFormElement>(
        'edit-course-form'
      );


    this.clearFormErrors(
      form
    );


    this.el<HTMLInputElement>(
      'edit-course-name'
    ).value =
      course.name;


    this.el<HTMLSelectElement>(
      'edit-course-day'
    ).value =
      course.day;


    this.el<HTMLInputElement>(
      'edit-course-time'
    ).value =
      this.removeClockText(
        course.time
      );


    this.el<HTMLInputElement>(
      'edit-course-trainer'
    ).value =
      course.trainer;


    this.el<HTMLInputElement>(
      'edit-course-capacity'
    ).value =
      String(
        course.capacity
      );


    this.openModal(
      'editCourseModal'
    );
  }


  private editCourse(
    event: Event
  ): void {

    event.preventDefault();


    const form =
      this.el<HTMLFormElement>(
        'edit-course-form'
      );


    this.clearFormErrors(
      form
    );


    const values: CourseFormValues = {

      name:
        this.el<HTMLInputElement>(
          'edit-course-name'
        ).value.trim(),

      day:
        this.el<HTMLSelectElement>(
          'edit-course-day'
        ).value,

      time:
        this.el<HTMLInputElement>(
          'edit-course-time'
        ).value,

      trainer:
        this.el<HTMLInputElement>(
          'edit-course-trainer'
        ).value.trim(),

      capacity:
        Number(
          this.el<HTMLInputElement>(
            'edit-course-capacity'
          ).value
        )
    };


    if (
      !this.validateCourseValues(
        values,
        'edit'
      )
    ) {

      this.showToast(
        'Bitte korrigiere die markierten Kursdaten.',
        'error'
      );

      return;
    }


    let editedCourse:
      Course | null = null;


    this.workoutCourses =
      this.workoutCourses.map(
        (course) => {

          if (
            !this.sameId(
              course.id,
              this.editingCourseId
            )
          ) {

            return course;
          }


          const updatedCourse: Course = {

            ...course,

            name:
              values.name,

            day:
              values.day,

            time:
              this.formatClockTime(
                values.time
              ),

            trainer:
              values.trainer,

            capacity:
              values.capacity
          };


          editedCourse =
            updatedCourse;


          return updatedCourse;
        }
      );


    if (editedCourse) {

      const changedCourse =
        editedCourse as Course;


      this.workoutBookings =
        this.workoutBookings.map(
          (booking) =>

            this.sameId(
              booking.courseId,
              this.editingCourseId
            )

              ? {

                  ...booking,

                  courseName:
                    changedCourse.name,

                  courseDay:
                    changedCourse.day,

                  courseTime:
                    changedCourse.time
                }

              : booking
        );
    }


    this.recalculateCourseSpots();

    this.saveAllData();


    this.closeModal(
      'editCourseModal'
    );


    this.editingCourseId =
      null;


    this.refreshAllViews(false);


    this.showToast(
      'Kurs wurde bearbeitet.',
      'success'
    );
  }


  /*
  ============================
  KURS VALIDIERUNG
  ============================
  */

  private validateCourseValues(
    values: CourseFormValues,
    mode: 'add' | 'edit'
  ): boolean {

    let valid = true;


    const prefix =
      mode === 'add'
        ? 'new'
        : 'edit';


    const requiredFields = [

      {
        value: values.name,
        input: `${prefix}-course-name`,
        error: `${prefix}-course-name-error`
      },

      {
        value: values.time,
        input: `${prefix}-course-time`,
        error: `${prefix}-course-time-error`
      },

      {
        value: values.trainer,
        input: `${prefix}-course-trainer`,
        error: `${prefix}-course-trainer-error`
      }
    ];


    requiredFields.forEach(
      (field) => {

        if (
          !String(
            field.value || ''
          ).trim()
        ) {

          this.setFieldError(
            this.el<HTMLInputElement>(
              field.input
            ),
            field.error,
            'Pflichtfeld'
          );


          valid = false;
        }
      }
    );


    if (
      !Number.isInteger(
        values.capacity
      ) ||
      values.capacity < 1
    ) {

      this.setFieldError(
        this.el<HTMLInputElement>(
          `${prefix}-course-capacity`
        ),
        `${prefix}-course-capacity-error`,
        'Mindestens 1 Gesamtplatz erforderlich'
      );


      valid = false;
    }


    if (
      mode === 'edit'
    ) {

      const bookedSpots =
        this.countBookingsForCourse(
          this.editingCourseId
        );


      if (
        values.capacity <
        bookedSpots
      ) {

        this.setFieldError(
          this.el<HTMLInputElement>(
            'edit-course-capacity'
          ),
          'edit-course-capacity-error',

          `Mindestens ${bookedSpots} Plätze, weil bereits ${bookedSpots} Buchungen bestehen`
        );


        valid = false;
      }
    }


    const duplicateCourse =
      this.workoutCourses.some(
        (course) => {

          const sameCourse =

            course.name
              .toLowerCase() ===
              values.name
                .toLowerCase()

            &&

            course.day ===
              values.day

            &&

            this.removeClockText(
              course.time
            ) === values.time;


          const isCurrentCourse =
            mode === 'edit' &&
            this.sameId(
              course.id,
              this.editingCourseId
            );


          return (
            sameCourse &&
            !isCurrentCourse
          );
        }
      );


    if (duplicateCourse) {

      this.setFieldError(
        this.el<HTMLInputElement>(
          `${prefix}-course-name`
        ),
        `${prefix}-course-name-error`,
        'Ein Kurs mit diesem Namen, Tag und dieser Uhrzeit existiert bereits'
      );


      valid = false;
    }


    return valid;
  }


  /*
  ============================
  KURS LÖSCHEN
  ============================
  */

  private openDeleteCourseModal(
    course: Course
  ): void {

    this.deletingCourseId =
      course.id;


    this.el<HTMLElement>(
      'delete-course-name'
    ).textContent =
      course.name;


    this.openModal(
      'deleteCourseModal'
    );
  }


  private deleteCourse(): void {

    const deletedCourse =
      this.workoutCourses.find(
        (course) =>
          this.sameId(
            course.id,
            this.deletingCourseId
          )
      );


    this.workoutCourses =
      this.workoutCourses.filter(
        (course) =>
          !this.sameId(
            course.id,
            this.deletingCourseId
          )
      );


    this.workoutBookings =
      this.workoutBookings.filter(
        (booking) =>
          !this.sameId(
            booking.courseId,
            this.deletingCourseId
          )
      );


    this.saveAllData();


    this.closeModal(
      'deleteCourseModal'
    );


    this.deletingCourseId =
      null;


    this.refreshAllViews(false);


    this.showToast(
      `${deletedCourse?.name || 'Kurs'} wurde gelöscht.`,
      'success'
    );
  }


  /*
  ============================
  KURS BUCHEN
  ============================
  */

  private openCourseBookingModal(
    course: Course
  ): void {

    if (
      course.spots <= 0
    ) {

      this.showToast(
        'Dieser Kurs ist ausgebucht.',
        'error'
      );

      return;
    }


    if (
      this.allMembers.length === 0
    ) {

      this.showToast(
        'Es sind keine Mitglieder vorhanden.',
        'error'
      );

      return;
    }


    this.selectedCourseId =
      course.id;


    this.el<HTMLElement>(
      'selected-course-info'
    ).textContent =

      `${course.name} | ` +
      `${course.day} | ` +
      `${course.time} | ` +
      `Trainer: ${course.trainer}`;


    const select =
      this.el<HTMLSelectElement>(
        'booking-member-select'
      );


    select.innerHTML = `
      <option value="">
        Mitglied auswählen
      </option>
    `;


    [...this.allMembers]

      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            'de'
          )
      )

      .forEach(
        (member) => {

          const option =
            document.createElement(
              'option'
            );


          option.value =
            String(member.id);


          option.textContent =
            `${member.memberNumber} – ${member.name}`;


          select.appendChild(
            option
          );
        }
      );


    this.openModal(
      'courseBookingModal'
    );
  }


  private bookCourse(
    event: Event
  ): void {

    event.preventDefault();


    const selectedMember =
      this.allMembers.find(
        (member) =>
          this.sameId(
            member.id,

            this.el<HTMLSelectElement>(
              'booking-member-select'
            ).value
          )
      );


    const selectedCourse =
      this.workoutCourses.find(
        (course) =>
          this.sameId(
            course.id,
            this.selectedCourseId
          )
      );


    if (
      !selectedMember ||
      !selectedCourse
    ) {

      this.showToast(
        'Bitte Mitglied und Kurs auswählen.',
        'error'
      );

      return;
    }


    const bookingAlreadyExists =
      this.workoutBookings.some(
        (booking) =>

          this.sameId(
            booking.memberId,
            selectedMember.id
          )

          &&

          this.sameId(
            booking.courseId,
            selectedCourse.id
          )
      );


    if (
      bookingAlreadyExists
    ) {

      this.showToast(
        'Dieses Mitglied hat den Kurs bereits gebucht.',
        'error'
      );

      return;
    }


    if (
      selectedCourse.spots <= 0
    ) {

      this.showToast(
        'Dieser Kurs ist ausgebucht.',
        'error'
      );

      return;
    }


    this.workoutBookings.unshift({

      id:
        this.generateId(),

      courseId:
        selectedCourse.id,

      courseName:
        selectedCourse.name,

      courseDay:
        selectedCourse.day,

      courseTime:
        selectedCourse.time,

      memberId:
        selectedMember.id,

      memberName:
        selectedMember.name,

      createdAt:
        new Date()
          .toLocaleString(
            'de-DE'
          )
    });


    this.recalculateCourseSpots();

    this.saveAllData();


    this.el<HTMLFormElement>(
      'course-booking-form'
    ).reset();


    this.closeModal(
      'courseBookingModal'
    );


    this.selectedCourseId =
      null;


    this.refreshAllViews(false);


    this.showToast(

      `${selectedMember.name} wurde für ${selectedCourse.name} gebucht.`,

      'success'
    );
  }


  /*
  ============================
  BUCHUNGSFILTER
  ============================
  */

  private refreshBookingCourseFilter(): void {

    const select =
      this.el<HTMLSelectElement>(
        'booking-course-filter'
      );


    const previousValue =
      select.value || 'Alle';


    select.innerHTML = `
      <option value="Alle">
        Alle Kurse
      </option>
    `;


    [...this.workoutCourses]

      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            'de'
          )
      )

      .forEach(
        (course) => {

          const option =
            document.createElement(
              'option'
            );


          option.value =
            String(course.id);


          option.textContent =
            course.name;


          select.appendChild(
            option
          );
        }
      );


    const valueStillExists =
      [...select.options].some(
        (option) =>
          option.value ===
          String(previousValue)
      );


    select.value =
      valueStillExists
        ? String(previousValue)
        : 'Alle';
  }


  private getFilteredBookings(): Booking[] {

    const searchValue =
      this.el<HTMLInputElement>(
        'booking-search'
      )
        .value
        .trim()
        .toLowerCase();


    const selectedCourse =
      this.el<HTMLSelectElement>(
        'booking-course-filter'
      ).value;


    return this.workoutBookings.filter(
      (booking) => {

        const matchesMember =
          booking.memberName
            .toLowerCase()
            .includes(
              searchValue
            );


        const matchesCourse =
          selectedCourse === 'Alle' ||
          this.sameId(
            booking.courseId,
            selectedCourse
          );


        return (
          matchesMember &&
          matchesCourse
        );
      }
    );
  }


  /*
  ============================
  BUCHUNGEN ANZEIGEN
  ============================
  */

  private showBookings(): void {

    const bookingList =
      this.el<HTMLUListElement>(
        'booking-list'
      );


    bookingList.innerHTML = '';


    const filteredBookings =
      this.getFilteredBookings();


    this.el<HTMLElement>(
      'booking-count'
    ).textContent =

      `${filteredBookings.length} von ` +
      `${this.workoutBookings.length} Buchungen`;


    if (
      filteredBookings.length === 0
    ) {

      bookingList.innerHTML = `

        <li class="booking-row empty-row">

          <div class="booking-title">
            Keine passenden Buchungen vorhanden
          </div>

        </li>
      `;


      return;
    }


    filteredBookings.forEach(
      (booking) => {

        const bookingElement =
          document.createElement(
            'li'
          );


        bookingElement.className =
          'booking-row';


        bookingElement.innerHTML = `

          <div>

            <div class="booking-title">
              ${this.escapeHTML(
                booking.courseName
              )}
            </div>


            <div class="booking-info">

              ${this.escapeHTML(
                booking.courseDay
              )}

              |

              ${this.escapeHTML(
                booking.courseTime
              )}

            </div>

          </div>


          <div>

            <div class="booking-title">
              ${this.escapeHTML(
                booking.memberName
              )}
            </div>


            <div class="booking-info">
              Mitglied
            </div>

          </div>


          <div class="booking-info">

            Gebucht:

            ${this.escapeHTML(
              booking.createdAt
            )}

          </div>


          <button
            type="button"
            class="btn-cancel-booking"
          >
            Stornieren
          </button>
        `;


        this.query<HTMLButtonElement>(
          bookingElement,
          '.btn-cancel-booking'
        ).addEventListener(
          'click',
          () =>
            this.cancelBooking(
              booking.id
            )
        );


        bookingList.appendChild(
          bookingElement
        );
      }
    );
  }


  private cancelBooking(
    bookingId: string | number
  ): void {

    const booking =
      this.workoutBookings.find(
        (item) =>
          this.sameId(
            item.id,
            bookingId
          )
      );


    if (!booking) {

      this.showToast(
        'Buchung wurde nicht gefunden.',
        'error'
      );

      return;
    }


    this.workoutBookings =
      this.workoutBookings.filter(
        (item) =>
          !this.sameId(
            item.id,
            bookingId
          )
      );


    this.recalculateCourseSpots();

    this.saveAllData();

    this.refreshAllViews(false);


    this.showToast(
      'Buchung wurde storniert.',
      'success'
    );
  }


  private clearBookingFilters(): void {

    this.clearBookingFiltersWithoutToast();

    this.showBookings();


    this.showToast(
      'Buchungsfilter wurden zurückgesetzt.',
      'success'
    );
  }


  private recalculateCourseSpots(): void {

    this.workoutCourses =
      this.workoutCourses.map(
        (course) => {

          const bookings =
            this.countBookingsForCourse(
              course.id
            );


          const capacity =
            Math.max(
              Number(
                course.capacity
              ) || 1,

              bookings
            );


          return {

            ...course,

            capacity,

            spots:
              Math.max(
                0,
                capacity -
                bookings
              )
          };
        }
      );
  }


  private countBookingsForCourse(
    courseId:
      string | number | null
  ): number {

    return this.workoutBookings.filter(
      (booking) =>
        this.sameId(
          booking.courseId,
          courseId
        )
    ).length;
  }


  /*
  ============================
  STATISTIK
  ============================
  */

  private renderStatistics(): void {

    const totalMembers =
      this.allMembers.length;


    const paymentData: ChartItem[] =
      this.paymentStatuses.map(
        (status) => {

          const count =
            this.allMembers.filter(
              (member) =>
                member.paymentStatus ===
                status
            ).length;


          return {

            label:
              status,

            value:
              count,

            maximum:
              totalMembers,

            valueText:
              String(count),

            className:
              this.getPaymentChartClass(
                status
              )
          };
        }
      );


    const trainingData: ChartItem[] =
      this.trainingPlans.map(
        (trainingPlan) => {

          const count =
            this.allMembers.filter(
              (member) =>
                member.trainingPlan ===
                trainingPlan
            ).length;


          return {

            label:
              trainingPlan,

            value:
              count,

            maximum:
              totalMembers,

            valueText:
              String(count),

            className:
              ''
          };
        }
      );


    const courseData: ChartItem[] =
      this.workoutCourses.map(
        (course) => {

          const bookedSpots =
            Math.max(
              0,

              course.capacity -
              course.spots
            );


          const percentage =
            course.capacity > 0
              ? Math.round(
                  (
                    bookedSpots /
                    course.capacity
                  ) * 100
                )
              : 0;


          return {

            label:
              course.name,

            value:
              percentage,

            maximum:
              100,

            valueText:
              `${percentage} % (${bookedSpots}/${course.capacity})`,

            className:
              ''
          };
        }
      );


    this.renderBarChart(

      this.el<HTMLElement>(
        'payment-chart'
      ),

      paymentData,

      'Keine Zahlungsdaten vorhanden.'
    );


    this.renderBarChart(

      this.el<HTMLElement>(
        'training-chart'
      ),

      trainingData,

      'Keine Trainingspläne vorhanden.'
    );


    this.renderBarChart(

      this.el<HTMLElement>(
        'course-chart'
      ),

      courseData,

      'Keine Kurse vorhanden.'
    );


    const paidMembers =
      paymentData.find(
        (item) =>
          item.label === 'Bezahlt'
      )?.value || 0;


    const paymentRate =
      totalMembers > 0
        ? Math.round(
            (
              paidMembers /
              totalMembers
            ) * 100
          )
        : 0;


    this.el<HTMLElement>(
      'statistics-payment-rate'
    ).textContent =
      `${paymentRate} %`;


    const popularPlan =
      trainingData.reduce(
        (best, current) =>

          current.value >
          best.value

            ? current

            : best,

        {
          label:
            'Keine Daten',

          value:
            0,

          maximum:
            0,

          valueText:
            '',

          className:
            ''
        }
      );


    this.el<HTMLElement>(
      'statistics-popular-plan'
    ).textContent =

      popularPlan.value > 0
        ? popularPlan.label
        : 'Keine Daten';


    const averageUsage =
      courseData.length > 0
        ? Math.round(
            courseData.reduce(
              (sum, course) =>
                sum +
                course.value,
              0
            ) /
            courseData.length
          )
        : 0;


    this.el<HTMLElement>(
      'statistics-course-usage'
    ).textContent =
      `${averageUsage} %`;
  }


  private renderBarChart(
    container: HTMLElement,
    items: ChartItem[],
    emptyMessage: string
  ): void {

    container.innerHTML = '';


    if (
      items.length === 0
    ) {

      container.innerHTML = `

        <p class="chart-empty">

          ${this.escapeHTML(
            emptyMessage
          )}

        </p>
      `;


      return;
    }


    items.forEach(
      (item) => {

        const maximum =
          Math.max(
            0,
            Number(
              item.maximum
            ) || 0
          );


        const value =
          Math.max(
            0,
            Number(
              item.value
            ) || 0
          );


        const width =
          maximum > 0
            ? Math.min(
                100,

                (
                  value /
                  maximum
                ) * 100
              )
            : 0;


        const itemElement =
          document.createElement(
            'div'
          );


        itemElement.className =
          'stat-bar-item';


        itemElement.innerHTML = `

          <div class="stat-bar-label-row">

            <span class="stat-bar-label">

              ${this.escapeHTML(
                item.label
              )}

            </span>


            <span class="stat-bar-value">

              ${this.escapeHTML(
                item.valueText
              )}

            </span>

          </div>


          <div class="stat-bar-track">

            <div
              class="stat-bar-fill
              ${item.className}"
            ></div>

          </div>
        `;


        const fill =
          this.query<HTMLElement>(
            itemElement,
            '.stat-bar-fill'
          );


        container.appendChild(
          itemElement
        );


        requestAnimationFrame(
          () => {

            fill.style.width =
              `${width}%`;
          }
        );
      }
    );
  }


  private getPaymentChartClass(
    status: PaymentStatus
  ): string {

    if (
      status === 'Bezahlt'
    ) {

      return 'is-success';
    }


    if (
      status === 'Offen'
    ) {

      return 'is-warning';
    }


    return 'is-danger';
  }


  /*
  ============================
  CSV EXPORT
  ============================
  */

  private exportMembersAsCSV(): void {

    const membersToExport =
      this.getFilteredMembers();


    if (
      membersToExport.length === 0
    ) {

      this.showToast(
        'Es sind keine Mitglieder für den Export vorhanden.',
        'error'
      );

      return;
    }


    const header = [

      'Mitgliedsnummer',

      'Eintrittsdatum',

      'Name',

      'E-Mail',

      'Telefon',

      'Stadt',

      'Firma',

      'Trainingsplan',

      'Tarif',

      'Monatsbeitrag',

      'Zahlungsstatus'
    ];


    const rows =
      membersToExport.map(
        (member) => [

          member.memberNumber,

          member.entryDate,

          member.name,

          member.email,

          member.phone,

          member.address.city,

          member.company.name,

          member.trainingPlan,

          member.tariff,

          member.monthlyFee
            .toFixed(2),

          member.paymentStatus
        ]
      );


    const csvContent =
      [header, ...rows]

        .map(
          (row) =>
            row
              .map(
                (value) =>
                  this.escapeCSVValue(
                    value
                  )
              )
              .join(';')
        )

        .join('\n');


    this.downloadFile(

      `workout-mitglieder-${this.getTodayISO()}.csv`,

      `\uFEFF${csvContent}`,

      'text/csv;charset=utf-8;'
    );


    this.showToast(
      `${membersToExport.length} Mitglieder wurden exportiert.`,
      'success'
    );
  }


  /*
  ============================
  JSON BACKUP
  ============================
  */

  private exportBackupAsJSON(): void {

    const backup = {

      version:
        2,

      exportedAt:
        new Date()
          .toISOString(),

      members:
        this.allMembers,

      courses:
        this.workoutCourses,

      bookings:
        this.workoutBookings
    };


    this.downloadFile(

      `workout-datensicherung-${this.getTodayISO()}.json`,

      JSON.stringify(
        backup,
        null,
        2
      ),

      'application/json;charset=utf-8;'
    );


    this.showToast(
      'Datensicherung wurde erstellt.',
      'success'
    );
  }


  private async importBackupFromJSON(
    event: Event
  ): Promise<void> {

    const input =
      event.target as HTMLInputElement;


    const file =
      input.files?.[0];


    if (!file) {

      return;
    }


    try {

      const text =
        await file.text();


      const backup =
        JSON.parse(text);


      if (
        !backup ||
        !Array.isArray(
          backup.members
        ) ||
        !Array.isArray(
          backup.courses
        ) ||
        !Array.isArray(
          backup.bookings
        )
      ) {

        throw new Error(
          'Ungültige Datensicherungs-Struktur'
        );
      }


      const importedMembers =
        backup.members.map(
          (
            member: any,
            index: number
          ) =>
            this.normalizeMember(
              member,
              index
            )
        );


      this.workoutBookings =
        backup.bookings

          .map(
            (booking: any) =>
              this.normalizeBooking(
                booking
              )
          )

          .filter(
            (
              booking: Booking | null
            ):
              booking is Booking =>
                booking !== null
          );


      this.workoutCourses =
        backup.courses.map(
          (
            course: any,
            index: number
          ) =>
            this.normalizeCourse(
              course,
              index
            )
        );


      this.allMembers =
        this.ensureUniqueMemberNumbers(
          importedMembers
        );


      const memberIds =
        new Set(
          this.allMembers.map(
            (member) =>
              String(member.id)
          )
        );


      const courseIds =
        new Set(
          this.workoutCourses.map(
            (course) =>
              String(course.id)
          )
        );


      this.workoutBookings =
        this.workoutBookings.filter(
          (booking) =>

            memberIds.has(
              String(
                booking.memberId
              )
            )

            &&

            courseIds.has(
              String(
                booking.courseId
              )
            )
        );


      this.synchronizeBookingNames();

      this.recalculateCourseSpots();

      this.saveAllData();


      this.clearMemberFiltersWithoutToast();

      this.clearBookingFiltersWithoutToast();


      this.refreshAllViews(true);


      this.showToast(
        'Datensicherung wurde erfolgreich importiert.',
        'success'
      );

    } catch (error) {

      console.error(
        'Import fehlgeschlagen:',
        error
      );


      this.showToast(
        'Die JSON-Datei ist ungültig oder beschädigt.',
        'error'
      );

    } finally {

      input.value = '';
    }
  }


  private synchronizeBookingNames(): void {

    this.workoutBookings =
      this.workoutBookings.map(
        (booking) => {

          const member =
            this.allMembers.find(
              (item) =>
                this.sameId(
                  item.id,
                  booking.memberId
                )
            );


          const course =
            this.workoutCourses.find(
              (item) =>
                this.sameId(
                  item.id,
                  booking.courseId
                )
            );


          return {

            ...booking,

            memberName:
              member?.name ||
              booking.memberName,

            courseName:
              course?.name ||
              booking.courseName,

            courseDay:
              course?.day ||
              booking.courseDay,

            courseTime:
              course?.time ||
              booking.courseTime
          };
        }
      );
  }


  private downloadFile(
    filename: string,
    content: string,
    mimeType: string
  ): void {

    const blob =
      new Blob(
        [content],
        {
          type: mimeType
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        'a'
      );


    link.href =
      url;


    link.download =
      filename;


    document.body.appendChild(
      link
    );


    link.click();

    link.remove();


    URL.revokeObjectURL(
      url
    );
  }


  /*
  ============================
  DRUCKEN
  ============================
  */

  private printSelectedMember(): void {

    if (
      !this.selectedMemberForPrint
    ) {

      this.showToast(
        'Kein Mitglied zum Drucken ausgewählt.',
        'error'
      );

      return;
    }


    const member =
      this.selectedMemberForPrint;


    const html = `

      <p class="print-brand">
        WORKOUT FITNESS-STUDIO
      </p>

      <h1>
        Mitgliederdaten
      </h1>

      <h2>
        ${this.escapeHTML(
          member.name
        )}
      </h2>


      <div class="print-grid">

        <p>
          <strong>
            Mitgliedsnummer:
          </strong>
          <br>

          ${this.escapeHTML(
            member.memberNumber
          )}
        </p>


        <p>
          <strong>
            Eintrittsdatum:
          </strong>
          <br>

          ${this.escapeHTML(
            this.formatDateDE(
              member.entryDate
            )
          )}
        </p>


        <p>
          <strong>
            E-Mail:
          </strong>
          <br>

          ${this.escapeHTML(
            member.email
          )}
        </p>


        <p>
          <strong>
            Telefon:
          </strong>
          <br>

          ${this.escapeHTML(
            member.phone
          )}
        </p>


        <p>
          <strong>
            Stadt:
          </strong>
          <br>

          ${this.escapeHTML(
            member.address.city
          )}
        </p>


        <p>
          <strong>
            Firma:
          </strong>
          <br>

          ${this.escapeHTML(
            member.company.name
          )}
        </p>


        <p>
          <strong>
            Trainingsplan:
          </strong>
          <br>

          ${this.escapeHTML(
            member.trainingPlan
          )}
        </p>


        <p>
          <strong>
            Tarif:
          </strong>
          <br>

          ${this.escapeHTML(
            member.tariff
          )}
        </p>


        <p>
          <strong>
            Monatsbeitrag:
          </strong>
          <br>

          ${this.escapeHTML(
            this.formatCurrency(
              member.monthlyFee
            )
          )}
        </p>


        <p>
          <strong>
            Zahlungsstatus:
          </strong>
          <br>

          ${this.escapeHTML(
            member.paymentStatus
          )}
        </p>

      </div>


      <p class="print-date">

        Ausdruck erstellt am

        ${this.escapeHTML(
          new Date()
            .toLocaleString(
              'de-DE'
            )
        )}

      </p>
    `;


    this.closeModal(
      'memberModal'
    );


    this.openPrintWindow(
      'WORKOUT Mitglied',
      html
    );
  }


  private printCourseList(): void {

    if (
      this.workoutCourses.length === 0
    ) {

      this.showToast(
        'Es sind keine Kurse zum Drucken vorhanden.',
        'error'
      );

      return;
    }


    const rows =
      [...this.workoutCourses]

        .sort(
          (a, b) =>
            this.compareCoursesByWeekdayAndTime(
              a,
              b
            )
        )

        .map(
          (course) => {

            const booked =
              course.capacity -
              course.spots;


            return `

              <tr>

                <td>
                  ${this.escapeHTML(
                    course.name
                  )}
                </td>

                <td>
                  ${this.escapeHTML(
                    course.day
                  )}
                </td>

                <td>
                  ${this.escapeHTML(
                    course.time
                  )}
                </td>

                <td>
                  ${this.escapeHTML(
                    course.trainer
                  )}
                </td>

                <td>
                  ${booked}
                  /
                  ${course.capacity}
                </td>

                <td>
                  ${course.spots}
                </td>

              </tr>
            `;
          }
        )

        .join('');


    const html = `

      <p class="print-brand">
        WORKOUT FITNESS-STUDIO
      </p>

      <h1>
        Kursliste
      </h1>


      <table>

        <thead>

          <tr>

            <th>Kurs</th>

            <th>Tag</th>

            <th>Uhrzeit</th>

            <th>Trainer</th>

            <th>
              Gebucht / Gesamt
            </th>

            <th>
              Freie Plätze
            </th>

          </tr>

        </thead>


        <tbody>

          ${rows}

        </tbody>

      </table>


      <p class="print-date">

        Ausdruck erstellt am

        ${this.escapeHTML(
          new Date()
            .toLocaleString(
              'de-DE'
            )
        )}

      </p>
    `;


    this.openPrintWindow(
      'WORKOUT Kursliste',
      html
    );
  }


  private openPrintWindow(
    title: string,
    html: string
  ): void {

    const printWindow =
      window.open(
        '',
        '_blank',
        'width=1000,height=800'
      );


    if (!printWindow) {

      this.showToast(
        'Das Druckfenster wurde vom Browser blockiert.',
        'error'
      );

      return;
    }


    printWindow.document.open();


    printWindow.document.write(`

      <!doctype html>

      <html lang="de">

      <head>

        <meta charset="UTF-8">

        <title>
          ${this.escapeHTML(title)}
        </title>


        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 40px;
            color: #111;
            font-family: Arial, sans-serif;
          }

          .print-brand {
            margin-bottom: 8px;
            color: red;
            font-weight: 900;
            letter-spacing: 2px;
          }

          h1 {
            margin: 0 0 25px;
          }

          h2 {
            margin: 0 0 20px;
          }

          .print-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .print-grid p {
            margin: 0;
            padding: 12px;
            border: 1px solid #ccc;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            padding: 10px;
            text-align: left;
            border: 1px solid #bbb;
          }

          th {
            background: #eee;
          }

          .print-date {
            margin-top: 30px;
          }

        </style>

      </head>


      <body>

        ${html}

      </body>

      </html>
    `);


    printWindow.document.close();

    printWindow.focus();


    setTimeout(
      () => {

        printWindow.print();

      },
      250
    );
  }


  /*
  ============================
  RESET
  ============================
  */

  private async resetAllData(): Promise<void> {

    localStorage.removeItem(
      this.localStorageKey
    );

    localStorage.removeItem(
      this.courseStorageKey
    );

    localStorage.removeItem(
      this.bookingStorageKey
    );


    this.workoutBookings = [];

    this.workoutCourses =
      this.createDefaultCourses();

    this.allMembers = [];


    this.clearMemberFiltersWithoutToast();

    this.clearBookingFiltersWithoutToast();


    this.closeModal(
      'resetModal'
    );


    this.allMembers =
      await this.loadMembers();


    this.allMembers =
      this.ensureUniqueMemberNumbers(
        this.allMembers
      );


    this.recalculateCourseSpots();

    this.saveAllData();


    this.refreshAllViews(true);


    this.showToast(
      'Alle Daten wurden zurückgesetzt.',
      'success'
    );
  }


  /*
  ============================
  LOGOUT
  ============================
  */

  private logout(): void {

    sessionStorage.removeItem(
      'workoutLoggedIn'
    );


    void this.router.navigate(
      ['/login']
    );
  }


  /*
  ============================
  FILTER RESET
  ============================
  */

  private clearMemberFiltersWithoutToast(): void {

    this.el<HTMLInputElement>(
      'member-search'
    ).value =
      '';


    this.el<HTMLSelectElement>(
      'payment-filter'
    ).value =
      'Alle';


    this.el<HTMLSelectElement>(
      'training-filter'
    ).value =
      'Alle';


    this.el<HTMLSelectElement>(
      'tariff-filter'
    ).value =
      'Alle';


    this.currentPage =
      1;
  }


  private clearBookingFiltersWithoutToast(): void {

    this.el<HTMLInputElement>(
      'booking-search'
    ).value =
      '';


    this.el<HTMLSelectElement>(
      'booking-course-filter'
    ).value =
      'Alle';
  }


  /*
  ============================
  MITGLIEDSNUMMERN
  ============================
  */

  private ensureUniqueMemberNumbers(
    members: Member[]
  ): Member[] {

    const usedNumbers =
      new Set<string>();


    let nextSequence =
      1;


    return members.map(
      (member) => {

        let memberNumber =
          String(
            member.memberNumber ||
            ''
          ).trim();


        if (
          !memberNumber ||
          usedNumbers.has(
            memberNumber
          )
        ) {

          while (
            usedNumbers.has(
              this.formatMemberNumber(
                nextSequence
              )
            )
          ) {

            nextSequence += 1;
          }


          memberNumber =
            this.formatMemberNumber(
              nextSequence
            );
        }


        usedNumbers.add(
          memberNumber
        );


        const parsedSequence =
          this.getMemberNumberSequence(
            memberNumber
          );


        if (
          parsedSequence >=
          nextSequence
        ) {

          nextSequence =
            parsedSequence + 1;
        }


        return {

          ...member,

          memberNumber
        };
      }
    );
  }


  private generateMemberNumber(): string {

    const highestSequence =
      this.allMembers.reduce(
        (highest, member) =>

          Math.max(

            highest,

            this.getMemberNumberSequence(
              member.memberNumber
            )
          ),

        0
      );


    return this.formatMemberNumber(
      highestSequence + 1
    );
  }


  private formatMemberNumber(
    sequence: number
  ): string {

    return (
      `W-${new Date().getFullYear()}-` +
      String(sequence).padStart(
        4,
        '0'
      )
    );
  }


  private getMemberNumberSequence(
    memberNumber: string
  ): number {

    const match =
      String(
        memberNumber || ''
      ).match(
        /(\d+)$/
      );


    return match
      ? Number(match[1])
      : 0;
  }


  /*
  ============================
  CSS KLASSEN
  ============================
  */

  private getPaymentClass(
    paymentStatus: PaymentStatus
  ): string {

    if (
      paymentStatus === 'Bezahlt'
    ) {

      return 'payment-paid';
    }


    if (
      paymentStatus === 'Offen'
    ) {

      return 'payment-open';
    }


    return 'payment-late';
  }


  private getTariffClass(
    tariff: Tariff
  ): string {

    if (
      tariff === 'Premium'
    ) {

      return 'tariff-premium';
    }


    if (
      tariff === 'VIP'
    ) {

      return 'tariff-vip';
    }


    return 'tariff-basic';
  }


  /*
  ============================
  KURSE SORTIEREN
  ============================
  */

  private compareCoursesByWeekdayAndTime(
    courseA: Course,
    courseB: Course
  ): number {

    const weekdays = [

      'Montag',

      'Dienstag',

      'Mittwoch',

      'Donnerstag',

      'Freitag',

      'Samstag',

      'Sonntag'
    ];


    const dayDifference =

      weekdays.indexOf(
        courseA.day
      )

      -

      weekdays.indexOf(
        courseB.day
      );


    if (
      dayDifference !== 0
    ) {

      return dayDifference;
    }


    return this
      .removeClockText(
        courseA.time
      )
      .localeCompare(
        this.removeClockText(
          courseB.time
        )
      );
  }


  /*
  ============================
  FORMULARFEHLER
  ============================
  */

  private clearFormErrors(
    form: HTMLFormElement
  ): void {

    form
      .querySelectorAll(
        '.input-error'
      )
      .forEach(
        (element) => {

          element.classList.remove(
            'input-error'
          );
        }
      );


    form
      .querySelectorAll<HTMLElement>(
        '.field-error'
      )
      .forEach(
        (element) => {

          element.textContent = '';
        }
      );
  }


  private setFieldError(
    input: HTMLElement,
    errorElementId: string,
    message: string
  ): void {

    input.classList.add(
      'input-error'
    );


    this.el<HTMLElement>(
      errorElementId
    ).textContent =
      message;
  }


  /*
  ============================
  DATUM UND EMAIL
  ============================
  */

  private isValidEmail(
    email: string
  ): boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }


  private isValidISODate(
    value: string
  ): boolean {

    return /^\d{4}-\d{2}-\d{2}$/.test(
      String(
        value || ''
      )
    );
  }


  private createDefaultEntryDate(
    index: number
  ): string {

    const date =
      new Date();


    date.setDate(
      date.getDate() -
      index * 14
    );


    return date
      .toISOString()
      .slice(
        0,
        10
      );
  }


  private getTodayISO(): string {

    const now =
      new Date();


    const localDate =
      new Date(
        now.getTime() -
        now.getTimezoneOffset() *
        60000
      );


    return localDate
      .toISOString()
      .slice(
        0,
        10
      );
  }


  private formatDateDE(
    value: string
  ): string {

    if (
      !this.isValidISODate(
        value
      )
    ) {

      return (
        value ||
        'Keine Angabe'
      );
    }


    const [
      year,
      month,
      day
    ] =
      value.split('-');


    return (
      `${day}.${month}.${year}`
    );
  }


  /*
  ============================
  GELD
  ============================
  */

  private formatCurrency(
    value: number
  ): string {

    return new Intl.NumberFormat(
      'de-DE',
      {

        style:
          'currency',

        currency:
          'EUR'
      }
    ).format(
      Number(value) || 0
    );
  }


  /*
  ============================
  UHRZEIT
  ============================
  */

  private normalizeClockTime(
    time: string
  ): string {

    const value =
      String(
        time || ''
      ).trim();


    return value.endsWith(
      ' Uhr'
    )
      ? value
      : `${value} Uhr`;
  }


  private removeClockText(
    time: string
  ): string {

    return String(
      time || ''
    ).replace(
      ' Uhr',
      ''
    );
  }


  private formatClockTime(
    time: string
  ): string {

    return `${time} Uhr`;
  }


  /*
  ============================
  IDS
  ============================
  */

  private sameId(
    firstId:
      string | number | null,
    secondId:
      string | number | null
  ): boolean {

    return (
      String(firstId) ===
      String(secondId)
    );
  }


  private generateId(): string {

    return (

      `${Date.now()}-` +

      `${Math.floor(
        Math.random() *
        100000
      )}`
    );
  }


  /*
  ============================
  CSV
  ============================
  */

  private escapeCSVValue(
    value: unknown
  ): string {

    return (
      '"' +
      String(value ?? '')
        .replaceAll(
          '"',
          '""'
        ) +
      '"'
    );
  }


  /*
  ============================
  MODALS OHNE BOOTSTRAP-JS
  ============================
  */

  private openModal(
    modalId: string
  ): void {

    const root =
      this.host.nativeElement;


    root
      .querySelectorAll<HTMLElement>(
        '.modal.show'
      )
      .forEach(
        (modal) => {

          if (
            modal.id !==
            modalId
          ) {

            this.closeModal(
              modal.id
            );
          }
        }
      );


    const modal =
      document.getElementById(
        modalId
      );


    if (!modal) {

      return;
    }


    modal.style.display =
      'block';


    modal.classList.add(
      'show'
    );


    modal.setAttribute(
      'aria-hidden',
      'false'
    );


    modal.setAttribute(
      'aria-modal',
      'true'
    );


    modal.setAttribute(
      'role',
      'dialog'
    );


    document.body.classList.add(
      'modal-open'
    );


    document.body.style.overflow =
      'hidden';


    this.removeModalBackdrop();


    const backdrop =
      document.createElement(
        'div'
      );


    backdrop.className =
      'modal-backdrop fade show';


    backdrop.addEventListener(
      'click',
      () => {

        this.closeModal(
          modalId
        );
      }
    );


    document.body.appendChild(
      backdrop
    );
  }


  private closeModal(
    modalId: string
  ): void {

    const modal =
      document.getElementById(
        modalId
      );


    if (!modal) {

      return;
    }


    modal.classList.remove(
      'show'
    );


    modal.style.display =
      'none';


    modal.setAttribute(
      'aria-hidden',
      'true'
    );


    modal.removeAttribute(
      'aria-modal'
    );


    this.removeModalBackdrop();


    document.body.classList.remove(
      'modal-open'
    );


    document.body.style.overflow =
      '';
  }


  private removeModalBackdrop(): void {

    document
      .querySelectorAll(
        '.modal-backdrop'
      )
      .forEach(
        (backdrop) => {

          backdrop.remove();
        }
      );
  }


  /*
  ============================
  TOAST
  ============================
  */

  private showToast(
    message: string,
    type:
      'success' |
      'error' = 'success'
  ): void {

    if (
      this.toastTimer
    ) {

      clearTimeout(
        this.toastTimer
      );
    }


    const toast =
      this.el<HTMLElement>(
        'toast-message'
      );


    toast.textContent =
      message;


    toast.className =
      `toast-message show ${type}`;


    this.toastTimer =
      setTimeout(
        () => {

          toast.className =
            'toast-message';

        },
        3000
      );
  }


  /*
  ============================
  HTML SICHER AUSGEBEN
  ============================
  */

  private escapeHTML(
    value: unknown
  ): string {

    return String(value)

      .replaceAll(
        '&',
        '&amp;'
      )

      .replaceAll(
        '<',
        '&lt;'
      )

      .replaceAll(
        '>',
        '&gt;'
      )

      .replaceAll(
        '"',
        '&quot;'
      )

      .replaceAll(
        "'",
        '&#039;'
      );
  }
}