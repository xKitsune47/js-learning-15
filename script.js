'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const monthOption = {
    month: 'long',
};

class App {
    #map;
    #mapZoom = 13;
    #mapEvent;
    #workouts = [];

    constructor() {
        this._getPosition();

        form.addEventListener('submit', this._newWorkout.bind(this));

        inputType.addEventListener('change', function (e) {
            inputElevation
                .closest('.form__row')
                .classList.toggle('form__row--hidden');
            inputCadence
                .closest('.form__row')
                .classList.toggle('form__row--hidden');
        });

        containerWorkouts.addEventListener(
            'click',
            this._moveToMarker.bind(this)
        );

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !form.classList.contains('hidden')) {
                form.classList.toggle('hidden');
            }
        });

        // Dunno why but I needed to set a timeout for this.
        // It probably has to do with the leaflet library and that
        // the local data loads faster than leaflet pulls map data
        // get local storage
        setTimeout(() => {
            this._loadWorkouts();
        }, 250);
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Could not get current position');
                }
            );
        }
    }

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;

        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, this.#mapZoom);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));
    }

    _showForm(e) {
        this.#mapEvent = e;
        form.classList.toggle('hidden');
        inputDistance.focus();
    }

    _newWorkout(e) {
        const validateInputs = (...inputs) =>
            inputs.every(input => Number.isFinite(input));
        const validatePositivity = (...inputs) =>
            inputs.every(input => input > 0);

        e.preventDefault();

        const { lat, lng } = this.#mapEvent.latlng;
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        let workout;

        // validate
        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (
                !validateInputs(distance, duration, cadence) ||
                !validatePositivity(distance, duration, cadence)
            ) {
                return alert('Check inputs');
            }
            workout = new Running(distance, duration, [lat, lng], cadence);
        }
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (
                !validateInputs(distance, duration, elevation) ||
                !validatePositivity(distance, duration)
            ) {
                return alert('Check inputs');
            }
            workout = new Cycling(distance, duration, [lat, lng], elevation);
        }

        this.#workouts.push(workout);

        // render marker on map
        this._renderWorkoutMarker(workout);

        // render workout on list
        this._renderWorkoutList(workout);

        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
                '';
        form.classList.add('hidden');

        // save to local storage
        this._saveWorkouts();
    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(`${workout.description}`)
            .openPopup();
    }

    _renderWorkoutList(workout) {
        const workoutHTML = `
            <li class="workout workout--${workout.type}" data-id="${
            workout.id
        }">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">${
                        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
                    }</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${
                        workout.type === 'running'
                            ? workout.pace
                            : workout.speed
                    }</span>
                    <span class="workout__unit">${
                        workout.type === 'running' ? 'min/km' : 'km/h'
                    }</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">${
                        workout.type === 'running' ? '🦶🏼' : '⛰'
                    }</span>
                    <span class="workout__value">${
                        workout.type === 'running'
                            ? workout.cadence
                            : workout.elevation
                    }</span>
                    <span class="workout__unit">${
                        workout.type === 'running' ? 'spm' : 'm'
                    }</span>
                </div>
            </li>
        `;
        form.insertAdjacentHTML('afterend', workoutHTML);
    }

    _moveToMarker(e) {
        const workoutElement = e.target.closest('.workout');

        if (!workoutElement) return;

        const workout = this.#workouts.find(
            element => element.id === workoutElement.dataset.id
        );

        console.log(workoutElement, workout);

        this.#map.setView(workout.coords, this.#mapZoom);
    }

    _saveWorkouts() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _loadWorkouts() {
        const loadedWorkouts = JSON.parse(localStorage.getItem('workouts'));

        if (!loadedWorkouts) return;

        this.#workouts = loadedWorkouts;

        this.#workouts.forEach(element => {
            console.log(element);
            this._renderWorkoutList(element);
            this._renderWorkoutMarker(element);
        });
    }
}

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(distance, duration, coords) {
        this.distance = distance; // km
        this.duration = duration; // min
        this.coords = coords; // [lat, lng]
    }

    _createDescription() {
        this.description = `${
            this.type.charAt(0).toUpperCase() + this.type.slice(1)
        } on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
        return this;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(distance, duration, coords, cadence) {
        super(distance, duration, coords);
        this.cadence = cadence;
        this.calcPace();
        this._createDescription();
    }

    calcPace() {
        this.pace = Math.round(this.duration / this.distance);
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(distance, duration, coords, elevation) {
        super(distance, duration, coords);
        this.elevation = elevation;
        this.calcSpeed();
        this._createDescription();
    }

    calcSpeed() {
        this.speed = Math.round(this.distance / (this.duration / 60));
        return this;
    }
}

const app = new App();

const run1 = new Running(5.2, 30, [51, 16], 180);
const cycle1 = new Cycling(5.2, 30, [51, 16], 200);
