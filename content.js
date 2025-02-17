/*
  Ubersmith Auto Ticket Closer - Chrome Extension
  Automates mass closing of tickets in Ubersmith based on keyword matching with confirmation
*/

// content.js - Injected into Ubersmith
(function() {
  console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");

  function closeMatchingTickets(keyword) {
      // Select the correct tbody that contains the ticket list
      let tbodies = document.querySelectorAll("tbody");
      let ticketTableBody = tbodies[2]; // Directly selecting tbody[2]

      if (!ticketTableBody) {
          console.error("Could not find tbody[2].");
          alert("Could not find the correct ticket list.");
          return;
      }

      console.log("Selected tbody:", ticketTableBody);

      let ticketRows = ticketTableBody.querySelectorAll("tr");
      let matchingTickets = [];
      
      ticketRows.forEach((row, index) => {
          // Highlight the row while iterating
          row.style.transition = "background-color 0.3s ease";
          row.style.backgroundColor = "#fffa90"; // Light yellow highlight
          
          setTimeout(() => {
              row.style.backgroundColor = ""; // Reset after 1 second
          }, 1000);

          let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']"); // Checkbox
          let ticketNumberCell = row.querySelector("td:nth-child(2)"); // Ticket number
          let subjectCell = row.querySelector("td:nth-child(3) a"); // Subject inside <a>

          if (!checkboxCell || !ticketNumberCell || !subjectCell) {
              console.warn(`Row ${index} is missing one or more required elements.`);
              return;
          }

          let subjectText = subjectCell.innerText.trim();
          let ticketNumber = ticketNumberCell.innerText.trim();

          console.log(`Checking Ticket #${ticketNumber} | Subject: ${subjectText}`);

          if (subjectText.includes(keyword)) {
              matchingTickets.push({ checkbox: checkboxCell, ticketNumber, subjectText });
              row.style.backgroundColor = "#ff6666"; // Highlight matching tickets in red
          }
      });

      console.log(`Found ${matchingTickets.length} matching tickets.`);

      if (matchingTickets.length === 0) {
          alert("No matching tickets found.");
          return;
      }

      let confirmClose = confirm(`Are you sure you want to close ${matchingTickets.length} tickets containing '${keyword}'?`);
      if (!confirmClose) return;

      // Select matching tickets
      matchingTickets.forEach(ticket => ticket.checkbox.checked = true);

      // Set bulk action to "Closed"
      let actionDropdown = document.querySelector("#action_type");
      if (!actionDropdown) {
          console.error("Action dropdown not found!");
          alert("Could not find bulk action dropdown. Please check page structure.");
          return;
      }
      actionDropdown.value = "3"; // Value for "Closed"

      // Submit bulk action
      let submitButton = document.querySelector("#action_update");
      if (!submitButton) {
          console.error("Submit button not found!");
          alert("Could not find submit button.");
          return;
      }

      console.log("Closing tickets...");
      submitButton.click();
      
      // Auto-refresh the page after closing tickets
      setTimeout(() => {
          location.reload();
      }, 3000); // Wait 3 seconds before refreshing
  }

  // Add UI Elements for user input
  let keywordInput = document.createElement("input");
  keywordInput.type = "text";
  keywordInput.placeholder = "Enter keyword to close tickets";
  keywordInput.style.position = "fixed";
  keywordInput.style.bottom = "60px";
  keywordInput.style.left = "20px";
  keywordInput.style.padding = "5px";
  keywordInput.style.border = "1px solid #ccc";

  let autoCloseButton = document.createElement("button");
  autoCloseButton.innerText = "Close Matching Tickets";
  autoCloseButton.style.position = "fixed";
  autoCloseButton.style.bottom = "20px";
  autoCloseButton.style.left = "20px";
  autoCloseButton.style.backgroundColor = "#FF5733";
  autoCloseButton.style.color = "white";
  autoCloseButton.style.padding = "10px";
  autoCloseButton.style.border = "none";
  autoCloseButton.style.cursor = "pointer";

  document.body.appendChild(keywordInput);
  document.body.appendChild(autoCloseButton);

  autoCloseButton.addEventListener("click", () => {
      let keyword = keywordInput.value.trim();
      if (keyword) {
          closeMatchingTickets(keyword);
      } else {
          alert("Please enter a keyword before proceeding.");
      }
  });
})();
