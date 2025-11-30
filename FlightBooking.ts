import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

// --- Type Definitions ---
interface Flight {
  id: string;
  airline: string;
  origin: string;
  destination: string;
  departure: string;
  price: number;
  availableSeats: number;
}

interface Booking {
  id: string;
  userId: string;
  flightId: string;
  flightDetails: Flight;
  travelerName: string;
  bookingDate: string;
}

interface SearchForm {
  origin: string;
  destination: string;
  departureDate: string;
  travelers: number;
}

// Minimal type definitions for Firebase services used locally
type FirebaseApp = any;
type Firestore = any;
type User = any;
type Auth = any;

@Component({
  selector: 'app-root',
  template: `
    <div class="min-h-screen bg-gray-900 p-4 md:p-8 font-sans">
      <div class="max-w-6xl mx-auto">

        <!-- Header (Black/Purple/Yellow Theme) -->
        <header class="text-center mb-8">
          <!-- Removed user ID from the main title -->
          <h1 class="text-4xl font-extrabold text-yellow-400">FlightBooker</h1>
          <p class="text-gray-400">
            Find, Book, and Fly. Seamless data handling with Firestore.
          </p>
          <div class="text-xs mt-1 text-gray-500">
            User ID: <span class="text-yellow-500 font-mono">{{ userId() ? userId().slice(0, 8) : 'Loading...' }}</span>
          </div>
        </header>

        <!-- Search Form Card -->
        <div class="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 transition-all duration-300 hover:shadow-xl shadow-purple-900/50">
          <h2 class="text-2xl font-semibold mb-4 text-purple-400">Search Flights</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Styling inputs for the dark theme -->
            <input class="p-3 border border-purple-700 bg-gray-700 text-gray-100 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 placeholder-gray-500"
                   type="text"
                   placeholder="Origin City (e.g., DEL)"
                   [value]="searchForm().origin"
                   (input)="updateSearch('origin', $event)"
                   required>
            <!-- Destination -->
            <input class="p-3 border border-purple-700 bg-gray-700 text-gray-100 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 placeholder-gray-500"
                   type="text"
                   placeholder="Destination City (e.g., SFO)"
                   [value]="searchForm().destination"
                   (input)="updateSearch('destination', $event)"
                   required>
            <!-- Date -->
            <input class="p-3 border border-purple-700 bg-gray-700 text-gray-100 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 placeholder-gray-500"
                   type="date"
                   [value]="searchForm().departureDate"
                   (input)="updateSearch('departureDate', $event)"
                   required>
            <!-- Travelers -->
            <input class="p-3 border border-purple-700 bg-gray-700 text-gray-100 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 placeholder-gray-500"
                   type="number"
                   placeholder="Travelers (1-9)"
                   [value]="searchForm().travelers"
                   (input)="updateSearch('travelers', $event)"
                   min="1" max="9"
                   required>
          </div>
          <button (click)="searchFlights()"
                  class="mt-6 w-full py-3 px-6 bg-purple-600 text-black font-bold rounded-xl shadow-md shadow-yellow-500/50 hover:bg-purple-500 transition duration-150 transform hover:scale-[1.01] active:scale-[0.99] disabled:bg-purple-400 disabled:shadow-none"
                  [disabled]="isSearching()">
            {{ isSearching() ? 'Searching...' : 'Find Flights' }}
          </button>
        </div>

        <!-- System Messages -->
        @if (message()) {
          <div class="p-4 mb-6 text-sm rounded-lg"
               [class]="message().type === 'success' ? 'bg-yellow-800 text-gray-900 font-bold' : 'bg-red-800 text-white'">
            {{ message().text }}
          </div>
        }

        <!-- Flight Results (Conditional Display) -->
        @if (searchResults().length > 0) {
          <h2 class="text-2xl font-semibold mb-4 text-yellow-400">Available Flights ({{ searchResults().length }})</h2>
          <div class="space-y-4">
            @for (flight of searchResults(); track flight.id) {
              <div class="bg-gray-800 p-5 rounded-xl shadow-lg border-l-4 border-purple-500 flex flex-col md:flex-row justify-between items-start md:items-center">
                
                <div class="flex-grow mb-3 md:mb-0">
                  <p class="text-lg font-bold text-gray-100">{{ flight.origin }} <span class="text-yellow-400 text-xl font-extrabold">→</span> {{ flight.destination }}</p>
                  <p class="text-sm text-gray-400">
                    {{ flight.airline }} | Departs: {{ flight.departure }} | Seats Left: {{ flight.availableSeats }}
                  </p>
                </div>

                <div class="flex items-center space-x-4">
                  <p class="text-2xl font-extrabold text-yellow-400">\${{ flight.price }}</p>
                  
                  @if (flight.availableSeats > 0) {
                    <button (click)="openBookingModal(flight)"
                            class="py-2 px-5 bg-purple-600 text-black rounded-full font-semibold shadow-md hover:bg-purple-500 transition duration-150 transform hover:scale-105 active:scale-95">
                      Book Now
                    </button>
                  } @else {
                    <span class="py-2 px-5 bg-gray-600 text-gray-400 rounded-full font-semibold opacity-70">Sold Out</span>
                  }
                </div>
              </div>
            }
          </div>
        } @else if (!isSearching() && searchAttempted()) {
           <div class="text-center p-8 bg-gray-800 rounded-xl shadow-lg shadow-purple-900/50">
             <p class="text-lg text-gray-400">No flights found for your selected criteria. Try different dates or routes.</p>
           </div>
        }

        <!-- Bookings List -->
        <h2 class="text-2xl font-semibold mt-10 mb-4 text-yellow-400">My Bookings ({{ userBookings().length }})</h2>
        @if (userBookings().length > 0) {
          <div class="space-y-4">
            @for (booking of userBookings(); track booking.id) {
              <div class="bg-gray-800 p-5 rounded-xl shadow-lg border-l-4 border-yellow-500">
                <p class="text-lg font-bold text-gray-100">{{ booking.flightDetails.origin }} → {{ booking.flightDetails.destination }}</p>
                <p class="text-sm text-gray-400">Traveler: {{ booking.travelerName }} | Airline: {{ booking.flightDetails.airline }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  Booking ID: {{ booking.id.slice(0, 12) }}... | Booked on: {{ booking.bookingDate }}
                </p>
              </div>
            }
          </div>
        } @else {
          <div class="text-center p-8 bg-gray-800 rounded-xl shadow-lg shadow-purple-900/50">
             <p class="text-lg text-gray-400">You currently have no active bookings.</p>
           </div>
        }

        <!-- Booking Modal -->
        @if (selectedFlight()) {
          <div class="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div class="bg-gray-800 p-8 rounded-xl shadow-2xl shadow-yellow-500/50 max-w-lg w-full">
              <h3 class="text-2xl font-bold mb-4 text-purple-400">Confirm Booking</h3>
              <p class="mb-4 text-gray-300">Booking flight: 
                <span class="font-semibold text-yellow-500">{{ selectedFlight().origin }} → {{ selectedFlight().destination }}</span>
                (\${{ selectedFlight().price }} per ticket)
              </p>

              <input class="w-full p-3 border border-purple-700 bg-gray-700 text-gray-100 rounded-lg mb-4 placeholder-gray-500"
                     type="text"
                     placeholder="Traveler's Full Name"
                     [value]="travelerName()"
                     (input)="travelerName.set($any($event.target).value)"
                     required>
              
              <div class="flex justify-end space-x-3">
                <button (click)="selectedFlight.set(null)"
                        class="py-2 px-4 bg-gray-600 text-gray-100 rounded-lg hover:bg-gray-500 transition">
                  Cancel
                </button>
                <button (click)="handleBooking()"
                        class="py-2 px-4 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 transition transform active:scale-95"
                        [disabled]="isBooking() || travelerName().length < 3">
                  {{ isBooking() ? 'Processing...' : 'Complete Booking' }}
                </button>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    /* Custom utility for the app background, ensuring height */
    :host {
      display: block;
      min-height: 100vh;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class App {
  // Firebase Signals
  app: FirebaseApp | null = null;
  db: Firestore | null = null;
  currentUser = signal<User | null>(null);
  userId = signal<string | null>(null);
  isAuthReady = signal(false);
  
  // Stored Firebase functions
  private firebaseFunctions: any = {};

  // App State Signals
  searchForm = signal<SearchForm>({
    origin: 'DEL',
    destination: 'SFO',
    departureDate: new Date().toISOString().split('T')[0],
    travelers: 1,
  });
  
  searchResults = signal<Flight[]>([]);
  userBookings = signal<Booking[]>([]);
  
  message = signal<{ text: string, type: 'success' | 'error' } | null>(null);
  isSearching = signal(false);
  isBooking = signal(false);
  searchAttempted = signal(false);

  // Modal State
  selectedFlight = signal<Flight | null>(null);
  travelerName = signal('');

  constructor() {
    this.initializeFirebase();
  }

  // --- FIREBASE INITIALIZATION & AUTHENTICATION ---
  private async initializeFirebase(): Promise<void> {
    try {
      // Dynamically import Firebase services
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
      const authModule = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
      const firestoreModule = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
      
      this.firebaseFunctions = {
          initializeApp,
          ...authModule,
          ...firestoreModule,
      };

      // Global variables provided by the environment
      const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'default-app-id';
      const firebaseConfig = JSON.parse(typeof (window as any).__firebase_config !== 'undefined' ? (window as any).__firebase_config : '{}');
      const initialAuthToken = typeof (window as any).__initial_auth_token !== 'undefined' ? (window as any).__initial_auth_token : null;

      if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
         console.error("Firebase configuration is missing.");
         this.isAuthReady.set(true);
         return;
      }
      
      this.app = this.firebaseFunctions.initializeApp(firebaseConfig);
      this.db = this.firebaseFunctions.getFirestore(this.app);
      const auth: Auth = this.firebaseFunctions.getAuth(this.app);

      // 1. Authenticate (required before Firestore calls)
      if (initialAuthToken) {
        await this.firebaseFunctions.signInWithCustomToken(auth, initialAuthToken);
      } else {
        await this.firebaseFunctions.signInAnonymously(auth);
      }

      // 2. Auth State Listener
      this.firebaseFunctions.onAuthStateChanged(auth, (user: User) => {
        this.currentUser.set(user);
        this.userId.set(user?.uid || crypto.randomUUID());
        this.isAuthReady.set(true);
        console.log('Auth Ready. User ID:', this.userId());

        // 3. Start listening to data once authenticated
        if (user && this.db) {
          this.listenForBookings();
          this.seedInitialDataIfEmpty();
        }
      });
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      this.isAuthReady.set(true);
      this.message.set({ text: 'Error initializing app. Check console for details.', type: 'error' });
    }
  }

  // --- DATA SEEDING ---
  private async seedInitialDataIfEmpty(): Promise<void> {
      if (!this.db || !this.userId()) return;
      const { collection, getDocs, setDoc, doc } = this.firebaseFunctions;

      // Note: Using 'default-app-id' as a placeholder for __app_id when generating collection paths.
      const flightsCollection = collection(this.db, `/artifacts/default-app-id/public/data/flights`);
      
      try {
        const snapshot = await getDocs(flightsCollection);
        if (snapshot.empty) {
          console.log("Seeding initial flight data...");
          const initialFlights: Flight[] = [
            { id: 'F001', airline: 'AirJet', origin: 'DEL', destination: 'SFO', departure: '08:00 AM', price: 950, availableSeats: 50 },
            { id: 'F002', airline: 'GlobalFly', origin: 'DEL', destination: 'SFO', departure: '03:30 PM', price: 1120, availableSeats: 12 },
            { id: 'F003', airline: 'SkyLiner', origin: 'SFO', destination: 'JFK', departure: '10:00 AM', price: 580, availableSeats: 5 },
            { id: 'F004', airline: 'AirJet', origin: 'JFK', destination: 'DEL', departure: '07:00 PM', price: 890, availableSeats: 0 },
            { id: 'F005', airline: 'GlobalFly', origin: 'DEL', destination: 'BOM', departure: '11:00 AM', price: 150, availableSeats: 25 },
          ];

          for (const flight of initialFlights) {
            await setDoc(doc(flightsCollection, flight.id), flight);
          }
          console.log("Initial flight data seeded successfully.");
        }
      } catch (error) {
        console.error("Error seeding data:", error);
      }
  }

  // --- SEARCH LOGIC ---
  updateSearch(key: keyof SearchForm, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchForm.update(form => ({ ...form, [key]: key === 'travelers' ? parseInt(value) || 0 : value }));
  }

  async searchFlights(): Promise<void> {
    if (!this.db || !this.isAuthReady()) return;
    const { collection, query, where, getDocs } = this.firebaseFunctions;

    this.isSearching.set(true);
    this.searchResults.set([]);
    this.message.set(null);
    this.searchAttempted.set(true);
    const { origin, destination, departureDate, travelers } = this.searchForm();
    
    if (!origin || !destination || !departureDate || travelers < 1) {
      this.message.set({ text: 'Please fill in all search criteria.', type: 'error' });
      this.isSearching.set(false);
      return;
    }

    // Fetch all flights matching the route
    const flightsRef = collection(this.db, `/artifacts/default-app-id/public/data/flights`);
    
    try {
      const q = query(
        flightsRef,
        where('origin', '==', origin.toUpperCase()),
        where('destination', '==', destination.toUpperCase()),
      );
      
      const snapshot = await getDocs(q);
      const flights: Flight[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data() as Flight;
        // Client-side filtering for simplicity and to match available seats/date
        if (data.availableSeats >= travelers) {
            flights.push({ ...data, id: doc.id });
        }
      });

      // Simple in-memory sorting by price
      flights.sort((a, b) => a.price - b.price);

      this.searchResults.set(flights);
      if (flights.length === 0) {
        this.message.set({ text: 'No flights found with enough available seats for your party.', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching flights:', error);
      this.message.set({ text: 'Failed to search flights due to a system error.', type: 'error' });
    } finally {
      this.isSearching.set(false);
    }
  }

  // --- BOOKING LOGIC ---
  openBookingModal(flight: Flight): void {
    this.selectedFlight.set(flight);
    this.message.set(null);
  }

  async handleBooking(): Promise<void> {
    const flight = this.selectedFlight();
    const travelers = this.searchForm().travelers;
    const travelerName = this.travelerName();
    const userId = this.userId();
    const { collection, doc, setDoc, addDoc } = this.firebaseFunctions;

    if (!flight || !this.db || !userId || travelers < 1 || travelerName.length < 3) return;

    this.isBooking.set(true);
    
    // Paths
    const flightsRef = collection(this.db, `/artifacts/default-app-id/public/data/flights`);
    // Private collection for user bookings
    const bookingsRef = collection(this.db, `/artifacts/default-app-id/users/${userId}/bookings`);

    try {
      // 1. Create the new booking document
      const newBooking: Omit<Booking, 'id'> = {
        userId,
        flightId: flight.id,
        flightDetails: flight,
        travelerName: travelerName,
        bookingDate: new Date().toISOString().split('T')[0],
      };
      
      await addDoc(bookingsRef, newBooking);

      // 2. Update flight capacity (simple decrement logic)
      const updatedSeats = flight.availableSeats - travelers;
      const flightDocRef = doc(flightsRef, flight.id);

      await setDoc(flightDocRef, { availableSeats: updatedSeats }, { merge: true });

      // Reset state and show success
      this.message.set({ text: 'Successfully booked ' + travelers + ' seat(s) on ' + flight.airline + '!', type: 'success' });
      this.selectedFlight.set(null);
      this.travelerName.set('');
      
      // We update the search results in memory for immediate UI feedback.
      this.searchResults.update(results => results.map(f => f.id === flight.id ? ({ ...f, availableSeats: updatedSeats }) : f));

    } catch (error) {
      console.error('Booking failed:', error);
      this.message.set({ text: 'Booking failed. Please try again.', type: 'error' });
    } finally {
      this.isBooking.set(false);
    }
  }

  // --- REAL-TIME DATA LISTENER ---
  listenForBookings(): void {
    if (!this.db || !this.userId()) return;
    const { collection, query, orderBy, onSnapshot } = this.firebaseFunctions;

    // Use private path: /artifacts/{appId}/users/{userId}/bookings
    const bookingsCollectionPath = `/artifacts/default-app-id/users/${this.userId()}/bookings`;
    const bookingsRef = collection(this.db, bookingsCollectionPath);
    const q = query(bookingsRef, orderBy('bookingDate', 'desc'));

    onSnapshot(q, (snapshot: any) => {
      const bookings: Booking[] = [];
      snapshot.forEach((doc: any) => {
        bookings.push({ ...doc.data() as Booking, id: doc.id });
      });
      this.userBookings.set(bookings);
    }, (error: any) => {
      console.error("Error listening to bookings:", error);
      this.message.set({ text: 'Failed to load your bookings history.', type: 'error' });
    });
  }
}
