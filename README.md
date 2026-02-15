# FlashDeck Study

## Project Timeline
- Rough draft started: Feb 4, 2026
- Final project completed: Feb 14, 2026
- Final optimizations: Feb 15, 2026

## Project Summary
FlashDeck Study is an interactive flashcard web app built with React. Users can create a deck, study by flipping cards, search and filter the set, and track known vs unknown progress. The deck persists across refreshes using localStorage.

## Key Features and Functionality
- CRUD flashcards: create, edit, delete
- Study mode: flip, next, previous
- Shuffle the current study set
- Mark cards as Known or Unknown
- Search across front and back
- Filter: All, Known, Unknown
- Sort: newest, oldest, A to Z (front)
- Keyboard shortcuts:
  - Space: flip
  - Left/Right arrows: previous/next
  - K: toggle known
- Persistence: auto save and load via localStorage

## Technologies Used
- JavaScript (ES6+)
- React (useState, useEffect, useMemo)
- HTML/CSS
- Vite
- GitHub Pages (deployment)

## Instructions for Use
1. Add a card with Front and Back, then click Add card.
2. Click the study card to flip it, or press Space.
3. Use Prev/Next or the Left/Right arrow keys to navigate.
4. Toggle known status with the Toggle Known button or the K key.
5. Use Search, Filter, and Sort to control the study set.
6. Refresh the page to confirm the deck persists.

## Run Locally
```bash
npm install
npm run dev