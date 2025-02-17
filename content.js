/*
  Ubersmith Auto Ticket Closer - Chrome Extension
  Automates mass closing of tickets in Ubersmith based on keyword matching with confirmation
*/

// content.js - Injected into Ubersmith
(function() {
  console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");
  
  function closeMatchingTickets(keyword) {
      // Select the second tbody (skip the first one which has a header row)
      let tbodies = document.querySelectorAll("tbody");
      if (tbodies.length < 2) {
          console.error("Could not find second tbody");
          alert("Could not find the ticket list tbody");
          return;
      }
      let ticketTableBody = tbodies[1];
      let ticketRows = ticketTableBody.querySelectorAll("tr");
      let matchingTickets = [];
      
      ticketRows.forEach(row => {
          row.style.transition = "background-color 0.3s ease"; // Smooth transition
          row.style.backgroundColor = "#fffa90"; // Light yellow highlight while iterating

          setTimeout(() => {
              row.style.backgroundColor = ""; // Reset after 1 second
          }, 1000);

          let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']"); // Checkbox
          let ticketNumberCell = row.querySelector("td:nth-child(2)"); // Ticket number
          let subjectCell = row.querySelector("td:nth-child(3) a"); // Subject text inside <a>
          
          if (checkboxCell && ticketNumberCell && subjectCell) {
              let subjectText = subjectCell.innerText.trim();
              let ticketNumber = ticketNumberCell.innerText.trim();

              console.log("Checking Ticket #", ticketNumber, "| Subject:", subjectText);

              if (subjectText.includes(keyword)) {
                  matchingTickets.push({ checkbox: checkboxCell, ticketNumber, subjectText });
                  row.style.backgroundColor = "#ff6666"; // Red highlight for matching tickets
              }
          }
      });

      console.log(`Found ${matchingTickets.length} matching tickets.`);

      if (matchingTickets.length > 0) {
          let confirmClose = confirm(`Are you sure you want to close ${matchingTickets.length} tickets containing '${keyword}'?`);
          if (!confirmClose) return;
      } else {
          alert("No matching tickets found.");
          return;
      }

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
      let submitButton = document.querySelector("#submit_button");
      if (!submitButton) {
          console.error("Submit button not found!");
          alert("Could not find submit button.");
          return;
      }

      console.log("Closing tickets...");
      submitButton.click();
  }

  // Add UI Elements
  let keywordInput = document.createElement("input");
  keywordInput.type = "text";
  keywordInput.placeholder = "Enter keyword to close tickets";
  keywordInput.style.position = "fixed";
  keywordInput.style.bottom = "60px";
  keywordInput.style.right = "20px";
  keywordInput.style.padding = "5px";

  let autoCloseButton = document.createElement("button");
  autoCloseButton.innerText = "Close Matching Tickets";
  autoCloseButton.style.position = "fixed";
  autoCloseButton.style.bottom = "20px";
  autoCloseButton.style.right = "20px";
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
      }
  });
})();
