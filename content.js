/*
  Ubersmith Auto Ticket Closer - Chrome Extension
  Automates mass closing of tickets in Ubersmith based on keyword matching with confirmation
*/

(function() {
    console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");

    let knownTickets = JSON.parse(localStorage.getItem("knownTickets")) || [];
    let ticketTitles = JSON.parse(localStorage.getItem("ticketTitles")) || {}; // Store ticket titles
    let knownKeywords = JSON.parse(localStorage.getItem("knownKeywords")) || []; // Store known keywords
    let confirmClosureClicked = false; // Flag to check if confirm closure button was clicked

    function createUI() {
        let panelDrawer = document.querySelector(".panel-drawer-content");
        if (!panelDrawer) {
            console.error("Could not find .panel-drawer-content to insert UI.");
            return;
        }

        let uiContainer = document.createElement("div");
        uiContainer.id = "uber-ui-container";
        uiContainer.style.padding = "20px";
        uiContainer.style.borderTop = "1px solid #ddd";
        uiContainer.style.marginTop = "10px";
        uiContainer.style.textAlign = "center";
        uiContainer.style.display = "flex";
        uiContainer.style.flexDirection = "column";
        uiContainer.style.gap = "10px";

        uiContainer.innerHTML = `
            <input id="keywordInput" type="text" placeholder="Enter keyword to search tickets" 
                style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px;">
            <button id="queryTicketsButton" style="padding: 10px; background:rgb(87, 168, 254); color: white; border: none; cursor: pointer; border-radius: 8px;">Find Matching Tickets</button>
            <input id="newKeywordInput" type="text" placeholder="Enter new keyword" 
                style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px;">
            <button id="addKeywordButton" style="padding: 10px; background: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 8px;">Add Keyword</button>
            <div id="knownKeywordsList" style="background: white; padding: 10px; border: 1px solid #ccc; max-height: 150px; overflow-y: auto; border-radius: 8px;"></div>
            <button id="confirmCloseButton" style="padding: 10px; background: #FF5733; color: white; border: none; cursor: pointer; border-radius: 8px;">Confirm Closure</button>
            <button id="clearKnownKeywordsButton" style="padding: 10px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px;">Clear Known Keywords</button>
            <span id="refreshTimer" style="margin-top: 10px; font-weight: bold;">Next refresh in: 5:00</span>
        `;
        panelDrawer.appendChild(uiContainer);

        updateKnownKeywordsUI();
    }

    function updateKnownKeywordsUI() {
        let knownKeywordsList = document.getElementById("knownKeywordsList");
        knownKeywordsList.innerHTML = "<strong>Known Keywords:</strong><br>";
        if (knownKeywords.length === 0) {
            knownKeywordsList.innerHTML += "No known keywords.";
        } else {
            knownKeywords.forEach(keyword => {
                let item = document.createElement("div");
                item.innerText = keyword;
                knownKeywordsList.appendChild(item);
            });
        }
    }

    function highlightAllRows() {
        let tbodies = document.querySelectorAll("tbody");
        let ticketTableBody = tbodies[2];

        if (!ticketTableBody) {
            console.error("Could not find tbody[2].");
            alert("Could not find the correct ticket list.");
            return;
        }

        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach((row, index) => {
            setTimeout(() => {
                row.style.transition = "background-color 0.4s ease";
                row.style.backgroundColor = "#FFCC80"; // Light orange highlight for matching tickets
                setTimeout(() => {
                    row.style.backgroundColor = ""; // Fade out
                }, 300); // Delay to start fading out
            }, index * 100); // Stagger the effect by 100ms for each row
        });
    }

    function findMatchingTickets(keyword) {
        let tbodies = document.querySelectorAll("tbody");
        let ticketTableBody = tbodies[2];

        if (!ticketTableBody) {
            console.error("Could not find tbody[2].");
            alert("Could not find the correct ticket list.");
            return;
        }

        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach((row, index) => {
            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            let ticketNumberCell = row.querySelector("td:nth-child(2)");
            let subjectCell = row.querySelector("td:nth-child(3) a");
            
            if (!checkboxCell || !subjectCell || !ticketNumberCell) return;
            
            let subjectText = subjectCell.innerText.trim();
            let ticketNumber = ticketNumberCell.innerText.trim();
            
            if (keyword && subjectText.includes(keyword)) {
                console.log(`Found matching ticket: ${ticketNumber} - ${subjectText}`);
                setTimeout(() => {
                    row.style.transition = "background-color 0.5s ease";
                    row.style.backgroundColor = "#FFCC80"; // Light orange highlight for matching tickets
                    checkboxCell.checked = true;
                }, 500); // Delay to ensure the highlight effect is visible
                if (!knownTickets.includes(ticketNumber)) {
                    knownTickets.push(ticketNumber);
                    ticketTitles[ticketNumber] = subjectText;
                }
            }
        });

        localStorage.setItem("knownTickets", JSON.stringify(knownTickets));
        localStorage.setItem("ticketTitles", JSON.stringify(ticketTitles));
    }

    function addKeyword() {
        let newKeywordInput = document.getElementById("newKeywordInput");
        let newKeyword = newKeywordInput.value.trim();
        if (newKeyword && !knownKeywords.includes(newKeyword)) {
            knownKeywords.push(newKeyword);
            localStorage.setItem("knownKeywords", JSON.stringify(knownKeywords));
            updateKnownKeywordsUI();
            newKeywordInput.value = ""; // Clear the input field
        }
    }

    function clearKnownKeywords() {
        localStorage.removeItem("knownKeywords");
        knownKeywords = [];
        updateKnownKeywordsUI();
        alert("Known keywords cleared.");
    }

    function startRefreshTimer() {
        let refreshTimer = document.getElementById("refreshTimer");
        let timeLeft = 300; // 5 minutes in seconds

        let timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                location.reload();
            } else {
                let minutes = Math.floor(timeLeft / 60);
                let seconds = timeLeft % 60;
                refreshTimer.innerText = `Next refresh in: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                timeLeft--;
            }
        }, 1000);
    }

    function closeMatchingTickets() {
        if (!confirmClosureClicked) {
            console.log("Confirm closure button was not clicked. Aborting closeMatchingTickets.");
            return;
        }

        let tbodies = document.querySelectorAll("tbody");
        let ticketTableBody = tbodies[2];

        if (!ticketTableBody) {
            console.error("Could not find tbody[2].");
            alert("Could not find the correct ticket list.");
            return;
        }

        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach((row, index) => {
            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            let ticketNumberCell = row.querySelector("td:nth-child(2)");
            let subjectCell = row.querySelector("td:nth-child(3) a");
            
            if (!checkboxCell || !subjectCell || !ticketNumberCell) return;
            
            let ticketNumber = ticketNumberCell.innerText.trim();
            
            if (knownTickets.includes(ticketNumber)) {
                checkboxCell.checked = true;
            }
        });

        // Set the action type to "Closed"
        let actionTypeDropdown = document.querySelector("#action_type");
        if (actionTypeDropdown) {
            actionTypeDropdown.value = "3"; // Set to "Closed"
            console.log("Set action type to Closed.");
        } else {
            console.error("Could not find the action type dropdown.");
        }

        // Simulate clicking the update button to close tickets
        let updateButton = document.querySelector("#action_update");
        if (updateButton) {
            console.log("Clicking the update button to close tickets.");
            updateButton.click();
        } else {
            console.error("Could not find the update button.");
        }

        // Clear known tickets after closing them
        knownTickets = [];
        localStorage.removeItem("knownTickets");
        localStorage.removeItem("ticketTitles");

        setTimeout(() => location.reload(), 3000);
    }

    setTimeout(() => {
        createUI();
        document.getElementById("queryTicketsButton").addEventListener("click", () => {
            let keyword = document.getElementById("keywordInput").value.trim();
            highlightAllRows();
            setTimeout(() => {
                findMatchingTickets(keyword);
            }, 800); // Delay to ensure the highlight effect is visible
        });
        document.getElementById("addKeywordButton").addEventListener("click", () => {
            addKeyword();
        });
        document.getElementById("confirmCloseButton").addEventListener("click", () => {
            confirmClosureClicked = true;
            closeMatchingTickets();
        });
        document.getElementById("clearKnownKeywordsButton").addEventListener("click", () => {
            clearKnownKeywords();
        });

        // Automatically search for known keywords
        knownKeywords.forEach(keyword => {
            highlightAllRows();
            setTimeout(() => {
                findMatchingTickets(keyword);
            }, 100); // Delay to ensure the highlight effect is visible
        });

        startRefreshTimer(); // Start the refresh timer

        // Run highlightAllRows and findMatchingTickets on page refresh
        highlightAllRows();
        setTimeout(() => {
            knownKeywords.forEach(keyword => {
                findMatchingTickets(keyword);
            });
        }, 500); // Delay to ensure the highlight effect is visible
    }, 1000);
})();
