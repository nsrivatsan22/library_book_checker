// Get references to our HTML elements
const form = document.getElementById('search-form');
const titleInput = document.getElementById('book-title');
const loadingSpinner = document.getElementById('loading');
const statusMessage = document.getElementById('status-message');
const resultLink = document.getElementById('result-link');
const searchButton = document.getElementById('search-button');

// Listen for the form to be submitted
form.addEventListener('submit', function(event) {
    event.preventDefault(); // Stop the form from reloading the page
    const bookTitle = titleInput.value.trim();
    if (bookTitle) {
        searchForBook(bookTitle);
    }
});

async function searchForBook(title) {
    // Show loading spinner and clear old results
    loadingSpinner.classList.remove('hidden');
    statusMessage.textContent = '';
    statusMessage.className = 'text-lg font-medium';
    resultLink.classList.add('hidden');
    searchButton.disabled = true;
    searchButton.textContent = 'Searching...';

    try {
        // --- THIS IS THE BIG CHANGE ---
        // Instead of fetching the library, we fetch OUR OWN API.
        // We send the book title as a query parameter.
        const response = await fetch(`/api/search?bookTitle=${encodeURIComponent(title)}`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        // Our API will send back a JSON response
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // 4. We found the element! Check its text.
        if (data.status === 'Available') {
            statusMessage.textContent = `"${title}" is likely AVAILABLE!`;
            statusMessage.classList.add('text-green-600');
        } else if (data.status === 'Checked Out') {
            statusMessage.textContent = `"${title}" is likely CHECKED OUT.`;
            statusMessage.classList.add('text-yellow-700');
        } else {
            statusMessage.textContent = `"${title}" was not found or is unavailable.`;
            statusMessage.classList.add('text-red-600');
        }

        // The API also sends back the direct URL
        resultLink.href = data.searchUrl;
        resultLink.classList.remove('hidden');

    } catch (error) {
        console.error('Fetch Error:', error);
        statusMessage.textContent = `Error: ${error.message}`;
        statusMessage.classList.add('text-red-600');
    } finally {
        // Hide loading spinner and re-enable button
        loadingSpinner.classList.add('hidden');
        searchButton.disabled = false;
        searchButton.textContent = 'Search';
    }
}