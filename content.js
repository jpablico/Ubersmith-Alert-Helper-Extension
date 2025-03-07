/*
  Ubersmith Auto Ticket Closer - Chrome Extension
  Automates mass closing of tickets in Ubersmith based on keyword matching with confirmation
*/

(function() {
    console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");

    // Constants for styling and animations
    const HIGHLIGHT_COLOR = "#FFCC80";
    const TRANSITION_DURATION = 400; // ms
    const HIGHLIGHT_DURATION = 500; // ms
    const STAGGER_DELAY = 100; // ms

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
            <div id="advancedSearchOptions" style="background: white; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-bottom: 10px; text-align: left;">
                <div style="font-weight: bold; margin-bottom: 5px;">Advanced Search Options:</div>
                <div style="display: flex; gap: 10px; margin-bottom: 5px;">
                    <div style="display: flex; align-items: center;">
                        <input type="checkbox" id="searchInSubject" checked>
                        <label for="searchInSubject">Subject</label>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <input type="checkbox" id="searchInDescription">
                        <label for="searchInDescription">Description</label>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <input type="checkbox" id="searchCaseSensitive">
                        <label for="searchCaseSensitive">Case Sensitive</label>
                    </div>
                </div>
            </div>
            <button id="queryTicketsButton" style="padding: 10px; background:rgb(87, 168, 254); color: white; border: none; cursor: pointer; border-radius: 8px;">Find Matching Tickets</button>
            <input id="newKeywordInput" type="text" placeholder="Enter new keyword" 
                style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px;">
            <button id="addKeywordButton" style="padding: 10px; background: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 8px;">Add Keyword</button>
            <div id="knownKeywordsList" style="background: white; padding: 10px; border: 1px solid #ccc; max-height: 150px; overflow-y: auto; border-radius: 8px;"></div>
            <button id="confirmCloseButton" style="padding: 10px; background: #FF5733; color: white; border: none; cursor: pointer; border-radius: 8px;">Confirm Closure</button>
            <button id="clearKnownKeywordsButton" style="padding: 10px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px;">Clear Known Keywords</button>
            <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                <label for="refreshInterval">Refresh interval (minutes):</label>
                <input id="refreshInterval" type="number" min="1" max="60" value="5" style="width: 60px;">
                <button id="applyRefreshInterval" style="padding: 5px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px;">Apply</button>
            </div>
            <span id="refreshTimer" style="margin-top: 10px; font-weight: bold;">Next refresh in: 5:00</span>
            <div id="ticketStatistics" style="background: #f8f8f8; padding: 10px; margin-top: 10px; border: 1px solid #ddd; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px;">Ticket Statistics</h3>
                <div style="display: flex; justify-content: space-between;">
                    <div>Found tickets: <span id="foundTicketsCount">0</span></div>
                    <div>Selected tickets: <span id="selectedTicketsCount">0</span></div>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 5px;">
                <button id="selectAllButton" style="padding: 10px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px; flex: 1;">Select All</button>
                <button id="deselectAllButton" style="padding: 10px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px; flex: 1;">Deselect All</button>
            </div>
            <div style="background: white; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-top: 10px;">
                <div style="font-weight: bold; margin-bottom: 5px;">Recent Searches:</div>
                <div id="searchHistoryList"></div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button id="saveConfigButton" style="padding: 10px; background: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 8px; flex: 1;">Save Config</button>
                <button id="loadConfigButton" style="padding: 10px; background: #2196F3; color: white; border: none; cursor: pointer; border-radius: 8px; flex: 1;">Load Config</button>
            </div>
            <div id="ticketPreviewModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 600px; background: white; padding: 20px; border-radius: 8px; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <h3 id="previewTicketTitle" style="margin: 0;">Ticket Preview</h3>
                        <button id="closePreviewModal" style="background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
                    </div>
                    <div id="previewTicketContent"></div>
                </div>
            </div>
            <div style="background: white; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-top: 10px; text-align: left;">
                <div style="font-weight: bold; margin-bottom: 5px;">Filter by status:</div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <label style="display: flex; align-items: center;">
                        <input type="checkbox" id="filterOpen" checked>
                        <span>Open</span>
                    </label>
                    <label style="display: flex; align-items: center;">
                        <input type="checkbox" id="filterPending">
                        <span>Pending</span>
                    </label>
                    <label style="display: flex; align-items: center;">
                        <input type="checkbox" id="filterClosed">
                        <span>Closed</span>
                    </label>
                </div>
            </div>
        `;
        panelDrawer.appendChild(uiContainer);

        // Set the refresh interval input to the saved value if it exists
        const savedInterval = localStorage.getItem("refreshInterval");
        if (savedInterval) {
            document.getElementById("refreshInterval").value = savedInterval;
        }

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
                item.style.display = "flex";
                item.style.justifyContent = "space-between";
                item.style.alignItems = "center";
                item.style.marginBottom = "5px";
                
                let keywordText = document.createElement("span");
                keywordText.innerText = keyword;
                
                let removeBtn = document.createElement("button");
                removeBtn.innerText = "×";
                removeBtn.style.backgroundColor = "#f44336";
                removeBtn.style.color = "white";
                removeBtn.style.border = "none";
                removeBtn.style.borderRadius = "50%";
                removeBtn.style.width = "20px";
                removeBtn.style.height = "20px";
                removeBtn.style.cursor = "pointer";
                removeBtn.style.display = "flex";
                removeBtn.style.justifyContent = "center";
                removeBtn.style.alignItems = "center";
                removeBtn.onclick = () => removeKeyword(keyword);
                
                item.appendChild(keywordText);
                item.appendChild(removeBtn);
                knownKeywordsList.appendChild(item);
            });
        }
    }

    function removeKeyword(keyword) {
        knownKeywords = knownKeywords.filter(k => k !== keyword);
        localStorage.setItem("knownKeywords", JSON.stringify(knownKeywords));
        updateKnownKeywordsUI();
    }

    function findTicketTable() {
        // Try to find the table by a more specific attribute
        const tables = document.querySelectorAll("table");
        for (const table of tables) {
            if (table.querySelector("th") && 
                table.querySelector("th").textContent && 
                table.querySelector("th").textContent.includes("Ticket")) {
                return table.querySelector("tbody");
            }
        }
        // Fallback to the current method
        return document.querySelectorAll("tbody")[2];
    }

    function highlightAllRows() {
        let ticketTableBody = findTicketTable();
        if (!ticketTableBody) {
            console.error("Could not find ticket table.");
            return;
        }

        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach((row, index) => {
            setTimeout(() => {
                row.style.transition = `background-color ${TRANSITION_DURATION/1000}s ease`;
                row.style.backgroundColor = HIGHLIGHT_COLOR;
                setTimeout(() => {
                    row.style.backgroundColor = "";
                }, HIGHLIGHT_DURATION);
            }, index * STAGGER_DELAY);
        });
    }

    function findMatchingTickets(keyword) {
        let ticketTableBody = findTicketTable();
        if (!ticketTableBody) {
            console.error("Could not find ticket table.");
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
            
            if (keyword && subjectText.toLowerCase().includes(keyword.toLowerCase())) {
                console.log(`Found matching ticket: ${ticketNumber} - ${subjectText}`);
                setTimeout(() => {
                    row.style.transition = `background-color ${TRANSITION_DURATION/1000}s ease`;
                    row.style.backgroundColor = HIGHLIGHT_COLOR;
                    checkboxCell.checked = true;
                }, STAGGER_DELAY * index);
                
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
            
            // Automatically search for the new keyword
            highlightAllRows();
            setTimeout(() => {
                findMatchingTickets(newKeyword);
            }, HIGHLIGHT_DURATION + 100);
        }
    }

    function clearKnownKeywords() {
        if (confirm("Are you sure you want to clear all keywords?")) {
            localStorage.removeItem("knownKeywords");
            knownKeywords = [];
            updateKnownKeywordsUI();
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    function startRefreshTimer() {
        if (window.refreshTimerInterval) {
            clearInterval(window.refreshTimerInterval);
        }
        
        let refreshTimer = document.getElementById("refreshTimer");
        const minutes = parseInt(localStorage.getItem("refreshInterval")) || 5;
        let timeLeft = minutes * 60; // Convert to seconds
        
        refreshTimer.innerText = `Next refresh in: ${formatTime(timeLeft)}`;
        
        window.refreshTimerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(window.refreshTimerInterval);
                location.reload();
            } else {
                timeLeft--;
                refreshTimer.innerText = `Next refresh in: ${formatTime(timeLeft)}`;
            }
        }, 1000);
    }

    function closeMatchingTickets() {
        const ticketCount = knownTickets.length;
        if (ticketCount === 0) {
            alert("No tickets to close.");
            return;
        }
        
        if (!confirmClosureClicked) {
            console.log("Confirm closure button was not clicked. Aborting closeMatchingTickets.");
            return;
        }

        let ticketTableBody = findTicketTable();
        if (!ticketTableBody) {
            console.error("Could not find ticket table.");
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

    function updateSearchHistory() {
        const searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
        let historyList = document.getElementById("searchHistoryList");
        
        historyList.innerHTML = "";
        searchHistory.slice(-5).forEach(item => {
            const historyItem = document.createElement("div");
            historyItem.style.display = "flex";
            historyItem.style.justifyContent = "space-between";
            historyItem.style.padding = "5px 0";
            historyItem.style.borderBottom = "1px solid #eee";
            
            const keywordSpan = document.createElement("span");
            keywordSpan.innerText = item.keyword;
            keywordSpan.style.cursor = "pointer";
            keywordSpan.onclick = () => {
                document.getElementById("keywordInput").value = item.keyword;
            };
            
            const dateSpan = document.createElement("span");
            dateSpan.innerText = new Date(item.date).toLocaleString();
            dateSpan.style.fontSize = "0.8em";
            dateSpan.style.color = "#888";
            
            historyItem.appendChild(keywordSpan);
            historyItem.appendChild(dateSpan);
            historyList.appendChild(historyItem);
        });
    }

    function showTicketPreview(ticketNumber, title, content) {
        document.getElementById("previewTicketTitle").innerText = `Ticket #${ticketNumber}: ${title}`;
        document.getElementById("previewTicketContent").innerHTML = content;
        document.getElementById("ticketPreviewModal").style.display = "block";
        
        document.getElementById("closePreviewModal").onclick = () => {
            document.getElementById("ticketPreviewModal").style.display = "none";
        };
    }

    // Add this function
    function showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.style.position = "fixed";
        notification.style.bottom = "20px";
        notification.style.right = "20px";
        notification.style.padding = "15px 20px";
        notification.style.borderRadius = "8px";
        notification.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
        notification.style.zIndex = "1000";
        notification.style.opacity = "0";
        notification.style.transition = "opacity 0.3s";
        
        switch (type) {
            case "success":
                notification.style.background = "#4CAF50";
                notification.style.color = "white";
                break;
            case "error":
                notification.style.background = "#f44336";
                notification.style.color = "white";
                break;
            case "warning":
                notification.style.background = "#ff9800";
                notification.style.color = "white";
                break;
            default:
                notification.style.background = "#2196F3";
                notification.style.color = "white";
        }
        
        notification.innerText = message;
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = "1";
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    setTimeout(() => {
        createUI();
        
        document.getElementById("queryTicketsButton").addEventListener("click", () => {
            let keyword = document.getElementById("keywordInput").value.trim();
            if (!keyword) {
                alert("Please enter a keyword to search.");
                return;
            }
            
            // Add to search history
            const searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
            searchHistory.push({
                keyword: keyword,
                date: new Date().toISOString()
            });
            if (searchHistory.length > 10) searchHistory.shift(); // Keep only 10 most recent
            localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
            updateSearchHistory();
            
            highlightAllRows();
            setTimeout(() => {
                findMatchingTickets(keyword);
            }, HIGHLIGHT_DURATION + 100);
        });
        
        document.getElementById("addKeywordButton").addEventListener("click", () => {
            addKeyword();
        });
        
        document.getElementById("newKeywordInput").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                addKeyword();
            }
        });
        
        document.getElementById("keywordInput").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                document.getElementById("queryTicketsButton").click();
            }
        });
        
        document.getElementById("confirmCloseButton").addEventListener("click", () => {
            const ticketCount = knownTickets.length;
            if (ticketCount === 0) {
                alert("No tickets to close.");
                return;
            }
            
            if (confirm(`Are you sure you want to close ${ticketCount} ticket(s)?`)) {
                confirmClosureClicked = true;
                closeMatchingTickets();
            }
        });
        
        document.getElementById("clearKnownKeywordsButton").addEventListener("click", () => {
            clearKnownKeywords();
        });
        
        document.getElementById("applyRefreshInterval").addEventListener("click", () => {
            const minutes = parseInt(document.getElementById("refreshInterval").value) || 5;
            localStorage.setItem("refreshInterval", minutes);
            startRefreshTimer();
        });

        document.getElementById("selectAllButton").addEventListener("click", () => {
            let ticketTableBody = findTicketTable();
            if (!ticketTableBody) return;
            
            let ticketRows = ticketTableBody.querySelectorAll("tr");
            ticketRows.forEach(row => {
                let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
                if (checkboxCell) checkboxCell.checked = true;
            });
            
            showNotification("All tickets selected", "info");
        });

        document.getElementById("deselectAllButton").addEventListener("click", () => {
            let ticketTableBody = findTicketTable();
            if (!ticketTableBody) return;
            
            let ticketRows = ticketTableBody.querySelectorAll("tr");
            ticketRows.forEach(row => {
                let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
                if (checkboxCell) checkboxCell.checked = false;
            });
            
            showNotification("All tickets deselected", "info");
        });

        // Automatically search for known keywords
        knownKeywords.forEach(keyword => {
            highlightAllRows();
            setTimeout(() => {
                findMatchingTickets(keyword);
            }, HIGHLIGHT_DURATION + 100);
        });

        startRefreshTimer(); // Start the refresh timer

        // Run highlightAllRows and findMatchingTickets on page refresh
        highlightAllRows();
        setTimeout(() => {
            knownKeywords.forEach(keyword => {
                findMatchingTickets(keyword);
            });
        }, HIGHLIGHT_DURATION + 100);
    }, 1000);
})();
