document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const apiKey = '163863b6e313491670b4f52c19c982df';

    // --- DOM ELEMENT REFERENCES ---
    const cityInput = document.getElementById('city-input');
    const searchButton = document.getElementById('search-button');
    const tempToggleButton = document.getElementById('temp-toggle-button');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const currentWeatherSection = document.getElementById('current-weather-section');
    const forecastSection = document.getElementById('forecast-section');

    // --- APP STATE ---
    let isCelsius = true;
    let currentWeatherData = null;
    let forecastData = null;

    // --- EVENT LISTENERS ---
    searchButton.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    tempToggleButton.addEventListener('click', toggleTemperatureUnit);

    // --- INITIALIZATION ---
    loadInitialWeather();

    // --- FUNCTIONS ---

    /**
     * Handles the search action when the search button is clicked or Enter is pressed.
     */
    function handleSearch() {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        } else {
            displayError("Please enter a city name.");
        }
    }

    /**
     * Fetches both current weather and forecast data from the OpenWeatherMap API.
     * @param {string} city - The name of the city to fetch weather for.
     */
    async function fetchWeatherData(city) {
        showLoading(true);
        try {
            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`),
                fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
            ]);

            if (!currentResponse.ok) {
                if (currentResponse.status === 404) throw new Error("City not found. Please try again.");
                else throw new Error("Could not retrieve weather data.");
            }
             if (!forecastResponse.ok) throw new Error("Could not retrieve forecast data.");

            currentWeatherData = await currentResponse.json();
            forecastData = await forecastResponse.json();

            displayAllWeatherData();
            localStorage.setItem('lastSearchedCity', city); // Save city to localStorage
        } catch (error) {
            displayError(error.message);
        } finally {
            showLoading(false);
        }
    }

    /**
     * Updates the entire UI with the fetched weather data.
     */
    function displayAllWeatherData() {
        displayCurrentWeather();
        displayForecast();
        updateWeatherBackground();
    }
    
    /**
     * Displays the current weather information in the UI.
     */
    function displayCurrentWeather() {
        if (!currentWeatherData) return;

        const { name, main, weather, wind, sys } = currentWeatherData;
        document.getElementById('city-name').textContent = name;
        document.getElementById('weather-description').textContent = weather[0].description;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
        document.getElementById('humidity').textContent = `${main.humidity}%`;
        document.getElementById('wind-speed').textContent = `${wind.speed.toFixed(1)} m/s`;
        document.getElementById('sunrise-time').textContent = new Date(sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('sunset-time').textContent = new Date(sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        updateTemperatureDisplay();
    }

    /**
     * Displays the 5-day forecast information in the UI.
     */
    function displayForecast() {
        if (!forecastData) return;

        const forecastCardsContainer = document.getElementById('forecast-cards');
        forecastCardsContainer.innerHTML = ''; // Clear previous forecast

        const dailyForecasts = forecastData.list.filter(item => item.dt_txt.includes("12:00:00"));

        dailyForecasts.forEach(day => {
            const temp = isCelsius ? day.main.temp : (day.main.temp * 9/5) + 32;
            const dayName = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });

            const card = document.createElement('div');
            card.className = 'forecast-card';
            card.innerHTML = `
                <p>${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                <p class="temp">${temp.toFixed(1)}&deg;${isCelsius ? 'C' : 'F'}</p>
            `;
            forecastCardsContainer.appendChild(card);
        });
    }

    /**
     * Updates the temperature display based on the selected unit (°C or °F).
     */
    function updateTemperatureDisplay() {
        if (!currentWeatherData) return;
        const temp = isCelsius ? currentWeatherData.main.temp : (currentWeatherData.main.temp * 9 / 5) + 32;
        document.getElementById('temperature').innerHTML = `${temp.toFixed(1)}&deg;${isCelsius ? 'C' : 'F'}`;
    }
    
    /**
     * Toggles the temperature unit between Celsius and Fahrenheit and updates the UI.
     */
    function toggleTemperatureUnit() {
        isCelsius = !isCelsius;
        displayAllWeatherData();
    }

    /**
     * Sets the body background based on the main weather condition.
     */
    function updateWeatherBackground() {
        const weatherCondition = currentWeatherData.weather[0].main.toLowerCase();
        document.body.className = ''; // Reset classes
        document.body.classList.add(weatherCondition);
    }
    
    /**
     * Loads weather for the last searched city or a default city on page load.
     */
    function loadInitialWeather() {
        const lastCity = localStorage.getItem('lastSearchedCity');
        fetchWeatherData(lastCity || 'London'); // Use last city or default to London
    }

    /**
     * Manages the visibility of the loading spinner and weather content.
     * @param {boolean} isLoading - True to show the loader, false to hide it.
     */
    function showLoading(isLoading) {
        loader.style.display = isLoading ? 'block' : 'none';
        errorMessage.style.display = 'none';
        if (isLoading) {
            currentWeatherSection.style.display = 'none';
            forecastSection.style.display = 'none';
        } else {
            currentWeatherSection.style.display = 'block';
            forecastSection.style.display = 'block';
        }
    }

    /**
     * Displays an error message to the user.
     * @param {string} message - The error message to display.
     */
    function displayError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        currentWeatherSection.style.display = 'none';
        forecastSection.style.display = 'none';
    }
});