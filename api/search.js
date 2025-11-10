/**
 * IMPORTANT: This file must be placed in a folder named `api`
 * Vercel automatically turns any file in the `/api` folder
 * into a serverless function (our backend proxy).
 *
 * This function will be available at YOUR_SITE.vercel.app/api/search
 */

// We need the 'jsdom' package to parse HTML on the server.
// We will add this to package.json so Vercel installs it.
import { JSDOM } from 'jsdom';

// These are the same constants from our old script
const SEARCH_URL_TEMPLATE = 'https://sccl.bibliocommons.com/v2/search?query={SEARCH_TERM}&searchType=keyword&f_FORMAT=EBOOK%7CBK&f_STATUS=LA%7C_online_';
const AVAILABILITY_SELECTOR = '[data-key="availability-status-available"]';
const AVAILABLE_TEXT = 'Available';

// This is the main function that Vercel will run
export default async function handler(request, response) {
    // 1. Get the book title from the query parameters
    const { bookTitle } = request.query;

    if (!bookTitle) {
        return response.status(400).json({ error: 'Missing bookTitle parameter' });
    }

    try {
        // 2. Build the *real* library search URL
        const searchUrl = SEARCH_URL_TEMPLATE.replace('{SEARCH_TERM}', encodeURIComponent(bookTitle));

        // 3. Fetch the library page (this works because it's a server!)
        const libraryResponse = await fetch(searchUrl);
        if (!libraryResponse.ok) {
            throw new Error(`Library server responded with status: ${libraryResponse.status}`);
        }
        const htmlText = await libraryResponse.text();

        // 4. Parse the HTML using jsdom
        const dom = new JSDOM(htmlText);
        const doc = dom.window.document;

        // 5. Find the status element (same logic as before)
        const statusElement = doc.querySelector(AVAILABILITY_SELECTOR);
        let status = 'Not Found'; // Default status

        if (statusElement) {
            const statusText = statusElement.textContent.trim();
            if (statusText.includes(AVAILABLE_TEXT)) {
                status = 'Available';
            } else {
                status = 'Checked Out';
            }
        }

        // 6. Send a clean JSON response back to our front-end
        response.status(200).json({
            status: status,
            searchUrl: searchUrl // Send the direct link
        });

    } catch (error) {
        console.error('Scraping Error:', error.message);
        response.status(500).json({ 
            error: 'Failed to fetch or parse library data.',
            details: error.message 
        });
    }
}