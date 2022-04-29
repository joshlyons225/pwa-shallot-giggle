// create db variable and connection
let db;
const request = indexedDB.open("budget_track", 1);

// this event will emit if the database version changes
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;

  // create a new transaction table with auto-increment PKs
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

// save result upon successful db connection
request.onsuccess = function (event) {
  db = event.target.result;

  // if app online, push db data to api
  if (navigator.onLine) {
    uploadTransaction();
  }
};

// error logging
request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// save data function during loss of internet service
function saveRecord(record) {
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // save to objectStore for new_transaction table
  const transactionObjectStore = transaction.objectStore("new_transaction");

  // add record to your store with add method
  transactionObjectStore.add(record);
}

// function to upload transaction to db
function uploadTransaction() {
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access created objectStore
  const transactionObjectStore = transaction.objectStore("new_transaction");

  // get all records and save as const
  const getAll = transactionObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // send any existing data to api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");
          // access the new_pizza object store
          const transactionObjectStore =
            transaction.objectStore("new_transaction");
          // clear all items in your store
          transactionObjectStore.clear();

          alert("All saved transactions have been pushed!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// run uploadTransaction function when service restored
window.addEventListener("online", uploadTransaction);
