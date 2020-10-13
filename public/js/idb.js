// create variable to hold db connection
let db;
// establish connection to IndexedDB
const request = indexedDB.open('budget_tracker', 1);

// event listener if db version is non-existant or changes
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  // create store to hold data, autoincrement primary key
  db.createObjectStore('new_budget', { autoIncrement: true });
};

// successful connection
request.onsuccess = function (event) {
  db = event.target.result;

  // check if app is online, upload data if it is
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onError = function (event) {
  console.log(event.target.errorCode);
};

// function to save data if no internet connection
function saveRecord(record) {
  // creates a new record and places it in object store
  const transaction = db.transaction(['new_budget'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('new_budget');
  budgetObjectStore.add(record);
};

// upload to database when app back online
function uploadBudget() {
  const transaction = db.transaction(['new_budget'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('new_budget');
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          response.json();
        })
        .then(() => {
          const transaction = db.transaction(['new_budget'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_budget');
          budgetObjectStore.clear();
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
};

window.addEventListener('online', uploadBudget);