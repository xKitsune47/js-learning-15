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

class Workout {
    constructor(id, distance, duration, coords, date) {
        this.id = id;
        this.distance = distance;
        this.duration = duration;
        this.coords = coords;
        this.date = date;
    }
}

const onMapClick = function (e) {
    console.log(e.latlng);
    console.log(e);
    console.log(e.latlng.lat, e.latlng.lng);
    L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
};

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            const { latitude } = position.coords;
            const { longitude } = position.coords;
            console.log(latitude, longitude);
            console.log(
                `https://www.google.pl/maps/@${latitude},${longitude},16.25z?entry=ttu`
            );
            console.log(position);

            const coords = [latitude, longitude];

            const map = L.map('map').setView(coords, 13);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            // map.on('click', onMapClick);
            map.on('click', function (e) {
                L.marker([e.latlng.lat, e.latlng.lng])
                    .addTo(map)
                    .bindPopup(
                        L.popup({
                            minWidth: 250,
                            minWidth: 100,
                            autoClose: false,
                            closeOnClick: false,
                            className: 'running-popup',
                            // className: 'cycling-popup',
                        })
                    )
                    .setPopupContent('Workout')
                    .openPopup();
            });
        },
        function () {
            alert('Could not get current position');
        }
    );
}
