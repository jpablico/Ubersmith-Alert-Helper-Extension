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
    const SCALE_FACTOR = 1.02; // 2% size increase

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
            
            <!-- Collapsible keywords section -->
            <div style="background: white; padding: 0; border: 1px solid #ccc; border-radius: 8px;">
                <div id="keywordsHeader" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; cursor: pointer; background-color: #f5f5f5; border-bottom: ${localStorage.getItem('keywordsCollapsed') === 'true' ? 'none' : '1px solid #ccc'};">
                    <strong>Known Keywords</strong>
                    <span id="toggleKeywords" style="font-size: 18px;">${localStorage.getItem('keywordsCollapsed') === 'true' ? '▶' : '▼'}</span>
                </div>
                <div id="knownKeywordsList" style="padding: 10px; max-height: 150px; overflow-y: auto; ${localStorage.getItem('keywordsCollapsed') === 'true' ? 'display: none;' : ''}"></div>
            </div>
            
            <button id="confirmCloseButton" style="padding: 10px; background: #FF5733; color: white; border: none; cursor: pointer; border-radius: 8px; margin: 10px 0;">Close Selected Tickets</button>
            
            <div style="display: flex; gap: 10px; margin-top: 5px;">
                <button id="selectAllButton" style="padding: 10px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px; flex: 1;">Select All</button>
                <button id="deselectAllButton" style="padding: 10px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px; flex: 1;">Deselect All</button>
            </div>
            
            <button id="selectProblemResolvedPairs" style="padding: 10px; background: #9C27B0; color: white; border: none; cursor: pointer; border-radius: 8px;">Select Problem/Resolved Pairs</button>
            
            <button id="clearKnownKeywordsButton" style="padding: 10px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px;">Clear Known Keywords</button>
            <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                <label for="refreshInterval">Refresh interval (minutes):</label>
                <input id="refreshInterval" type="number" min="1" max="60" value="5" style="width: 60px;">
                <button id="applyRefreshInterval" style="padding: 5px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px;">Apply</button>
            </div>
            <span id="refreshTimer" style="margin-top: 10px; font-weight: bold;">Next refresh in: 5:00</span>
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
        knownKeywordsList.innerHTML = "";
        
        if (knownKeywords.length === 0) {
            knownKeywordsList.innerHTML = "<div style='font-style: italic; color: #888;'>No known keywords</div>";
        } else {
            knownKeywords.forEach(keyword => {
                let item = document.createElement("div");
                item.style.display = "flex";
                item.style.justifyContent = "space-between";
                item.style.alignItems = "center";
                item.style.marginBottom = "5px";
                
                let keywordText = document.createElement("span");
                keywordText.innerText = keyword;
                keywordText.style.cursor = "pointer";
                keywordText.onclick = () => {
                    document.getElementById("keywordInput").value = keyword;
                    document.getElementById("queryTicketsButton").click();
                };
                
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
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeKeyword(keyword);
                };
                
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
        const tables = document.querySelectorAll("table");
        for (const table of tables) {
            if (table.querySelector("th") && 
                table.querySelector("th").textContent && 
                table.querySelector("th").textContent.includes("Ticket")) {
                return table.querySelector("tbody");
            }
        }
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
                row.style.transition = `background-color ${TRANSITION_DURATION/1000}s ease, transform ${TRANSITION_DURATION/1000}s ease`;
                row.style.backgroundColor = HIGHLIGHT_COLOR;
                row.style.transform = `scale(${SCALE_FACTOR})`;
                row.style.zIndex = "1";
                row.style.position = "relative";
                
                setTimeout(() => {
                    row.style.backgroundColor = "";
                    row.style.transform = "scale(1)";
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
            
            // Add checkbox change event listener to update highlighting
            if (!checkboxCell.hasEventListener) {
                checkboxCell.addEventListener("change", (e) => {
                    if (e.target.checked) {
                        row.style.transition = `background-color ${TRANSITION_DURATION/1000}s ease, transform ${TRANSITION_DURATION/1000}s ease`;
                        row.style.backgroundColor = HIGHLIGHT_COLOR;
                        row.style.transform = `scale(${SCALE_FACTOR})`;
                        row.style.zIndex = "1";
                        row.style.position = "relative";
                    } else {
                        row.style.backgroundColor = "";
                        row.style.transform = "scale(1)";
                    }
                });
                checkboxCell.hasEventListener = true;
            }
            
            if (keyword && subjectText.toLowerCase().includes(keyword.toLowerCase())) {
                console.log(`Found matching ticket: ${ticketNumber} - ${subjectText}`);
                setTimeout(() => {
                    row.style.transition = `background-color ${TRANSITION_DURATION/1000}s ease, transform ${TRANSITION_DURATION/1000}s ease`;
                    row.style.backgroundColor = HIGHLIGHT_COLOR;
                    row.style.transform = `scale(${SCALE_FACTOR})`;
                    row.style.zIndex = "1";
                    row.style.position = "relative";
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

        const selectedCloseAction = "3";
        const selectedCloseActionText = "Close";
        
        console.log(`Using action type: ${selectedCloseActionText} (${selectedCloseAction})`);

        let ticketTableBody = findTicketTable();
        if (!ticketTableBody) {
            console.error("Could not find ticket table.");
            alert("Could not find the correct ticket list.");
            return;
        }

        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach((row) => {
            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            let ticketNumberCell = row.querySelector("td:nth-child(2)");
            
            if (!checkboxCell || !ticketNumberCell) return;
            
            let ticketNumber = ticketNumberCell.innerText.trim();
            
            if (knownTickets.includes(ticketNumber)) {
                checkboxCell.checked = true;
            }
        });

        let actionSelectDropdown = document.querySelector("#action_select");
        if (actionSelectDropdown) {
            actionSelectDropdown.value = "status";
            // Trigger change event to make the action_type dropdown visible
            const event = new Event('change', { bubbles: true });
            actionSelectDropdown.dispatchEvent(event);
            console.log("Set action to Change Status To");
        } else {
            console.error("Could not find the action select dropdown.");
            return;
        }

        setTimeout(() => {
            let actionTypeDropdown = document.querySelector("#action_type");
            if (actionTypeDropdown) {
                // Use the selected value from our dropdown
                actionTypeDropdown.value = selectedCloseAction;
                console.log(`Set action type to ${selectedCloseActionText} with value: ${selectedCloseAction}`);

                const event = new Event('change', { bubbles: true });
                actionTypeDropdown.dispatchEvent(event);
            } else {
                console.error("Could not find the action type dropdown.");
                return;
            }
            

            setTimeout(() => {
                let updateButton = document.querySelector("#action_update");
                if (updateButton) {
                    console.log(`Clicking the update button to ${selectedCloseActionText.toLowerCase()} tickets.`);
                    updateButton.click();
                } else {
                    updateButton = document.querySelector("input[type='submit'][name='submit']") || 
                                   document.querySelector("button[type='submit']");
                    if (updateButton) {
                        console.log("Found alternative update button, clicking it.");
                        updateButton.click();
                    } else {
                        console.error("Could not find any update button.");
                        return;
                    }
                }
                
                // Clear known tickets after processing them
                knownTickets = [];
                localStorage.removeItem("knownTickets");
                localStorage.removeItem("ticketTitles");
                
                setTimeout(() => location.reload(), 3000);
            }, 500); // Wait for action_type change to take effect
        }, 500); // Wait for action_select change to take effect
    }

    function selectAllTickets() {
        let ticketTableBody = findTicketTable();
        if (!ticketTableBody) return;
        
        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach(row => {
            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            if (checkboxCell) {
                checkboxCell.checked = true;
                row.style.transition = `background-color ${TRANSITION_DURATION/1000}s ease, transform ${TRANSITION_DURATION/1000}s ease`;
                row.style.backgroundColor = HIGHLIGHT_COLOR;
                row.style.transform = `scale(${SCALE_FACTOR})`;
                row.style.zIndex = "1";
                row.style.position = "relative";
            }
        });
    }

    function deselectAllTickets() {
        let ticketTableBody = findTicketTable();
        if (!ticketTableBody) return;
        
        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach(row => {
            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            if (checkboxCell) {
                checkboxCell.checked = false;
                row.style.backgroundColor = "";
                row.style.transform = "scale(1)";
            }
        });
        
        // Clear known tickets when deselecting all
        knownTickets = [];
        localStorage.removeItem("knownTickets");
        localStorage.removeItem("ticketTitles");
    }

    function toggleKeywordsList() {
        const keywordsList = document.getElementById('knownKeywordsList');
        const toggleIcon = document.getElementById('toggleKeywords');
        const keywordsHeader = document.getElementById('keywordsHeader');
        const isCollapsed = keywordsList.style.display === 'none';
        
        // Toggle display
        keywordsList.style.display = isCollapsed ? 'block' : 'none';
        toggleIcon.textContent = isCollapsed ? '▼' : '▶';
        keywordsHeader.style.borderBottom = isCollapsed ? '1px solid #ccc' : 'none';
        
        localStorage.setItem('keywordsCollapsed', !isCollapsed);
    }

    function selectProblemResolvedPairs() {
        let ticketTableBody = findTicketTable();
        if (!ticketTableBody) {
            console.error("Could not find ticket table.");
            return;
        }
    
        const problemTickets = {};
        const resolvedTickets = {};
        let ticketRows = ticketTableBody.querySelectorAll("tr");
        
        ticketRows.forEach(row => {
            const subjectCell = row.querySelector("td:nth-child(3) a");
            const ticketNumberCell = row.querySelector("td:nth-child(2)");
            
            if (!subjectCell || !ticketNumberCell) return;
            
            const ticketNumber = ticketNumberCell.innerText.trim();
            const subject = subjectCell.innerText.trim();
            

            if (subject.startsWith("Problem:")) {
                const title = subject.substring("Problem:".length).trim();
                problemTickets[title] = {
                    ticketNumber,
                    row
                };
            } else if (subject.startsWith("Resolved:")) {
                const title = subject.substring("Resolved:".length).trim();
                resolvedTickets[title] = {
                    ticketNumber,
                    row
                };
            }
        });
        
        let pairCount = 0;
        for (const title in problemTickets) {
            if (resolvedTickets[title]) {
                pairCount++;
                
                // Select both tickets
                const problemRow = problemTickets[title].row;
                const resolvedRow = resolvedTickets[title].row;
                const problemNumber = problemTickets[title].ticketNumber;
                const resolvedNumber = resolvedTickets[title].ticketNumber;
                const problemCheckbox = problemRow.querySelector("td:nth-child(1) input[type='checkbox']");
                const resolvedCheckbox = resolvedRow.querySelector("td:nth-child(1) input[type='checkbox']");
                
                if (problemCheckbox) {
                    problemCheckbox.checked = true;
                    problemRow.style.transition = `background-color ${TRANSITION_DURATION/1000}s ease, transform ${TRANSITION_DURATION/1000}s ease`;
                    problemRow.style.backgroundColor = HIGHLIGHT_COLOR;
                    problemRow.style.transform = `scale(${SCALE_FACTOR})`;
                    problemRow.style.zIndex = "1";
                    problemRow.style.position = "relative";
                    
                    // Add to known tickets
                    if (!knownTickets.includes(problemNumber)) {
                        knownTickets.push(problemNumber);
                        ticketTitles[problemNumber] = `Problem: ${title}`;
                    }
                }
                
                if (resolvedCheckbox) {
                    resolvedCheckbox.checked = true;
                    // Apply highlighting
                    resolvedRow.style.transition = `background-color ${TRANSITION_DURATION/1000}s ease, transform ${TRANSITION_DURATION/1000}s ease`;
                    resolvedRow.style.backgroundColor = HIGHLIGHT_COLOR;
                    resolvedRow.style.transform = `scale(${SCALE_FACTOR})`;
                    resolvedRow.style.zIndex = "1";
                    resolvedRow.style.position = "relative";
                    
                    // Add to known tickets
                    if (!knownTickets.includes(resolvedNumber)) {
                        knownTickets.push(resolvedNumber);
                        ticketTitles[resolvedNumber] = `Resolved: ${title}`;
                    }
                }
                
                console.log(`Selected matching pair: "${title}"`);
            }
        }
        
        // Update localStorage
        localStorage.setItem("knownTickets", JSON.stringify(knownTickets));
        localStorage.setItem("ticketTitles", JSON.stringify(ticketTitles));
        
        // Show result to user
        if (pairCount > 0) {
            alert(`Found and selected ${pairCount} Problem/Resolved ticket pairs`);
        } else {
            alert("No matching Problem/Resolved ticket pairs found");
        }
    }

    setTimeout(() => {
        createUI();
        
        document.getElementById("queryTicketsButton").addEventListener("click", () => {
            let keyword = document.getElementById("keywordInput").value.trim();
            if (!keyword) {
                alert("Please enter a keyword to search.");
                return;
            }
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
            selectAllTickets();
        });

        document.getElementById("deselectAllButton").addEventListener("click", () => {
            deselectAllTickets();
        });

        document.getElementById("selectAllButton").addEventListener("click", selectAllTickets);
        document.getElementById("deselectAllButton").addEventListener("click", deselectAllTickets);
        document.getElementById("keywordsHeader").addEventListener("click", toggleKeywordsList);
        document.getElementById("selectProblemResolvedPairs").addEventListener("click", selectProblemResolvedPairs);
        document.getElementById("selectProblemResolvedPairs").addEventListener("click", selectProblemResolvedPairs);

        // Automatically search for known keywords
        knownKeywords.forEach(keyword => {
            highlightAllRows();
            setTimeout(() => {
                findMatchingTickets(keyword);
            }, HIGHLIGHT_DURATION + 100);
        });

        startRefreshTimer(); 

        // Run highlightAllRows and findMatchingTickets on page refresh
        highlightAllRows();
        setTimeout(() => {
            knownKeywords.forEach(keyword => {
                findMatchingTickets(keyword);
            });
        }, HIGHLIGHT_DURATION + 100);
    }, 1000);
})();
