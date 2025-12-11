let simplePlayers = [];

let advancedPlayers = [];
let lootEvents = [];

function timeToMinutes(timeString) {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(Math.floor(num));
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message fade-in';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

    const activeTab = document.querySelector('.tab-pane.active');
    activeTab.insertBefore(errorDiv, activeTab.firstChild);

    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message fade-in';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

    const activeTab = document.querySelector('.tab-pane.active');
    activeTab.insertBefore(successDiv, activeTab.firstChild);

    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

function addPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const joinTime = document.getElementById('joinTime').value;
    const leaveTime = document.getElementById('leaveTime').value;
    
    if (!name) {
        showError('Please enter a player name');
        return;
    }
    
    if (!joinTime) {
        showError('Please enter a join time');
        return;
    }

    if (simplePlayers.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showError('Player already exists');
        return;
    }
    
    const player = {
        id: Date.now(),
        name: name,
        joinTime: joinTime,
        leaveTime: leaveTime || null
    };
    
    simplePlayers.push(player);
    updatePlayersTable();

    document.getElementById('playerName').value = '';
    document.getElementById('joinTime').value = '';
    document.getElementById('leaveTime').value = '';
    
    showSuccess(`Player "${name}" added successfully`);
}

function removePlayer(playerId) {
    simplePlayers = simplePlayers.filter(p => p.id !== playerId);
    updatePlayersTable();
    showSuccess('Player removed');
}

function updatePlayersTable() {
    const tbody = document.getElementById('playersTable');
    
    if (simplePlayers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No players added yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = simplePlayers.map(player => `
        <tr>
            <td><strong>${player.name}</strong></td>
            <td>${player.joinTime}</td>
            <td>${player.leaveTime || '<span class="text-success">Active</span>'}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removePlayer(${player.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function calculateSimpleSplit() {
    if (simplePlayers.length === 0) {
        showError('Please add at least one player');
        return;
    }
    
    const totalLoot = parseFloat(document.getElementById('totalLoot').value);
    if (!totalLoot || totalLoot <= 0) {
        showError('Please enter a valid total loot amount');
        return;
    }

    let endTime = null;
    simplePlayers.forEach(player => {
        if (player.leaveTime) {
            const leaveMinutes = timeToMinutes(player.leaveTime);
            if (!endTime || leaveMinutes > endTime) {
                endTime = leaveMinutes;
            }
        }
    });

    if (!endTime) {
        const now = new Date();
        endTime = now.getHours() * 60 + now.getMinutes();
    }

    const results = [];
    let totalDuration = 0;
    
    simplePlayers.forEach(player => {
        const joinMinutes = timeToMinutes(player.joinTime);
        const leaveMinutes = player.leaveTime ? timeToMinutes(player.leaveTime) : endTime;
        
        if (leaveMinutes <= joinMinutes) {
            showError(`Invalid time range for player ${player.name}`);
            return;
        }
        
        const duration = leaveMinutes - joinMinutes;
        totalDuration += duration;
        
        results.push({
            name: player.name,
            duration: duration,
            joinTime: player.joinTime,
            leaveTime: player.leaveTime
        });
    });
    
    if (totalDuration === 0) {
        showError('Total participation time is zero');
        return;
    }

    results.forEach(result => {
        result.percentage = (result.duration / totalDuration) * 100;
        result.lootShare = (result.duration / totalDuration) * totalLoot;
    });
    
    displaySimpleResults(results, totalLoot, totalDuration);
}

function displaySimpleResults(results, totalLoot, totalDuration) {
    const resultsDiv = document.getElementById('simpleResults');
    
    const html = `
        <div class="fade-in">
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="text-center">
                        <div class="stat-value">${formatNumber(totalLoot)}</div>
                        <div class="stat-label">Total Loot</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-center">
                        <div class="stat-value">${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m</div>
                        <div class="stat-label">Total Duration</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-center">
                        <div class="stat-value">${results.length}</div>
                        <div class="stat-label">Players</div>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Duration</th>
                            <th>Contribution</th>
                            <th>Loot Share</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(result => `
                            <tr>
                                <td><strong>${result.name}</strong></td>
                                <td>${Math.floor(result.duration / 60)}h ${result.duration % 60}m</td>
                                <td>${result.percentage.toFixed(1)}%</td>
                                <td class="loot-amount">${formatNumber(result.lootShare)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
    showSuccess('Loot split calculated successfully!');
}

function addAdvancedPlayer() {
    const name = document.getElementById('advPlayerName').value.trim();
    const joinTime = document.getElementById('advJoinTime').value;
    const leaveTime = document.getElementById('advLeaveTime').value;
    
    if (!name) {
        showError('Please enter a player name');
        return;
    }
    
    if (!joinTime) {
        showError('Please enter a join time');
        return;
    }

    if (advancedPlayers.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showError('Player already exists');
        return;
    }
    
    const player = {
        id: Date.now(),
        name: name,
        joinTime: joinTime,
        leaveTime: leaveTime || null
    };
    
    advancedPlayers.push(player);
    updateAdvancedPlayersTable();
    
    document.getElementById('advPlayerName').value = '';
    document.getElementById('advJoinTime').value = '';
    document.getElementById('advLeaveTime').value = '';
    
    showSuccess(`Player "${name}" added to party`);
}

function removeAdvancedPlayer(playerId) {
    advancedPlayers = advancedPlayers.filter(p => p.id !== playerId);
    updateAdvancedPlayersTable();
    showSuccess('Player removed from party');
}

function updateAdvancedPlayersTable() {
    const tbody = document.getElementById('advPlayersTable');
    
    if (advancedPlayers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No players added</td></tr>';
        return;
    }
    
    tbody.innerHTML = advancedPlayers.map(player => `
        <tr>
            <td><strong>${player.name}</strong></td>
            <td>${player.joinTime}</td>
            <td>${player.leaveTime || '<span class="text-success">Active</span>'}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeAdvancedPlayer(${player.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function addLootEvent() {
    const lootTime = document.getElementById('lootTime').value;
    const lootAmount = parseFloat(document.getElementById('lootAmount').value);
    
    if (!lootTime) {
        showError('Please enter a loot time');
        return;
    }
    
    if (!lootAmount || lootAmount <= 0) {
        showError('Please enter a valid loot amount');
        return;
    }
    
    const lootEvent = {
        id: Date.now(),
        time: lootTime,
        amount: lootAmount
    };
    
    lootEvents.push(lootEvent);
    lootEvents.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    updateLootEventsTable();
    
    // Clear form
    document.getElementById('lootTime').value = '';
    document.getElementById('lootAmount').value = '';
    
    showSuccess(`Loot event added: ${formatNumber(lootAmount)} at ${lootTime}`);
}

function removeLootEvent(eventId) {
    lootEvents = lootEvents.filter(e => e.id !== eventId);
    updateLootEventsTable();
    showSuccess('Loot event removed');
}

function updateLootEventsTable() {
    const tbody = document.getElementById('lootEventsTable');
    
    if (lootEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No loot events added</td></tr>';
        return;
    }
    
    tbody.innerHTML = lootEvents.map(event => `
        <tr>
            <td>${event.time}</td>
            <td>${formatNumber(event.amount)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeLootEvent(${event.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function calculateAdvancedSplit() {
    if (advancedPlayers.length === 0) {
        showError('Please add at least one player to the party');
        return;
    }
    
    if (lootEvents.length === 0) {
        showError('Please add at least one loot event');
        return;
    }
    
    const playerTotals = {};
    const playerDetails = {};
    
    advancedPlayers.forEach(player => {
        playerTotals[player.name] = 0;
        playerDetails[player.name] = [];
    });
    
    lootEvents.forEach(event => {
        const lootTimeMinutes = timeToMinutes(event.time);
        const activePlayers = [];
        
        advancedPlayers.forEach(player => {
            const joinMinutes = timeToMinutes(player.joinTime);
            const leaveMinutes = player.leaveTime ? timeToMinutes(player.leaveTime) : Infinity;
            
            if (joinMinutes <= lootTimeMinutes && lootTimeMinutes < leaveMinutes) {
                activePlayers.push(player.name);
            }
        });
        
        if (activePlayers.length > 0) {
            const sharePerPlayer = event.amount / activePlayers.length;
            
            activePlayers.forEach(playerName => {
                playerTotals[playerName] += sharePerPlayer;
                playerDetails[playerName].push({
                    time: event.time,
                    amount: sharePerPlayer,
                    totalPlayers: activePlayers.length
                });
            });
        }
    });
    
    displayAdvancedResults(playerTotals, playerDetails);
}

function displayAdvancedResults(playerTotals, playerDetails) {
    const resultsDiv = document.getElementById('advancedResults');
    
    const totalLoot = lootEvents.reduce((sum, event) => sum + event.amount, 0);
    const sortedPlayers = Object.entries(playerTotals)
        .sort(([,a], [,b]) => b - a)
        .filter(([,amount]) => amount > 0);
    
    if (sortedPlayers.length === 0) {
        resultsDiv.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>No loot distributed. Check if players were active during loot events.</p>
            </div>
        `;
        return;
    }
    
    const html = `
        <div class="fade-in">
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="text-center">
                        <div class="stat-value">${formatNumber(totalLoot)}</div>
                        <div class="stat-label">Total Loot</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="text-center">
                        <div class="stat-value">${lootEvents.length}</div>
                        <div class="stat-label">Loot Events</div>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Total Loot</th>
                            <th>Percentage</th>
                            <th>Events</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedPlayers.map(([playerName, amount]) => `
                            <tr>
                                <td><strong>${playerName}</strong></td>
                                <td class="loot-amount">${formatNumber(amount)}</td>
                                <td>${((amount / totalLoot) * 100).toFixed(1)}%</td>
                                <td>
                                    <span class="badge bg-info">${playerDetails[playerName].length} events</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4">
                <h6><i class="fas fa-info-circle"></i> Event Details</h6>
                <div class="accordion" id="eventAccordion">
                    ${sortedPlayers.map(([playerName, amount], index) => `
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="heading${index}">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                                    ${playerName} - ${formatNumber(amount)} total
                                </button>
                            </h2>
                            <div id="collapse${index}" class="accordion-collapse collapse" data-bs-parent="#eventAccordion">
                                <div class="accordion-body">
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Time</th>
                                                    <th>Share</th>
                                                    <th>Players</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${playerDetails[playerName].map(detail => `
                                                    <tr>
                                                        <td>${detail.time}</td>
                                                        <td>${formatNumber(detail.amount)}</td>
                                                        <td>${detail.totalPlayers} active</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
    showSuccess('Advanced loot distribution calculated successfully!');
}


document.addEventListener('DOMContentLoaded', function() {

    updatePlayersTable();
    updateAdvancedPlayersTable();
    updateLootEventsTable();
    
    document.getElementById('playerName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addPlayer();
    });
    
    document.getElementById('advPlayerName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addAdvancedPlayer();
    });
    
    document.getElementById('lootAmount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addLootEvent();
    });
});
