document.addEventListener('DOMContentLoaded', function() {
    // Add member functionality
    const addMemberBtn = document.getElementById('addMember');
    const membersContainer = document.getElementById('membersContainer');
    
    // Counter for unique member identification
    let memberCount = 1;
    
    // Add new member row
    addMemberBtn.addEventListener('click', function() {
        memberCount++;
        
        const memberRow = document.createElement('div');
        memberRow.className = 'member-row mb-3 p-3 border rounded bg-light';
        memberRow.innerHTML = `
            <div class="row align-items-end">
                <div class="col-md-6">
                    <label class="form-label">
                        <i class="fas fa-user me-1"></i>
                        Member Name
                    </label>
                    <input type="text" class="form-control" name="member_name[]" 
                           placeholder="Enter player name" required>
                </div>
                <div class="col-md-4">
                    <label class="form-label">
                        <i class="fas fa-clock me-1"></i>
                        Join Time (UTC)
                    </label>
                    <input type="time" class="form-control" name="member_join_time[]" required>
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-outline-danger btn-sm w-100 remove-member">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        membersContainer.appendChild(memberRow);
        
        // Auto-focus on the new member's name input
        const nameInput = memberRow.querySelector('input[name="member_name[]"]');
        nameInput.focus();
        
        // Update remove button event listeners
        updateRemoveButtons();
    });
    
    // Update remove button event listeners
    function updateRemoveButtons() {
        const removeButtons = document.querySelectorAll('.remove-member');
        
        removeButtons.forEach(button => {
            button.onclick = function() {
                const memberRows = document.querySelectorAll('.member-row');
                
                // Prevent removing the last member
                if (memberRows.length > 1) {
                    // Add fade out animation
                    this.closest('.member-row').style.animation = 'fadeOut 0.3s ease-out';
                    
                    setTimeout(() => {
                        this.closest('.member-row').remove();
                    }, 300);
                } else {
                    // Show a temporary message
                    const alert = document.createElement('div');
                    alert.className = 'alert alert-warning alert-dismissible fade show mt-2';
                    alert.innerHTML = `
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        At least one party member is required.
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    `;
                    
                    this.closest('.member-row').appendChild(alert);
                    
                    // Auto-dismiss after 3 seconds
                    setTimeout(() => {
                        if (alert.parentNode) {
                            alert.remove();
                        }
                    }, 3000);
                }
            };
        });
    }
    
    // Initialize remove button listeners
    updateRemoveButtons();
    
    // Form validation enhancements
    const form = document.getElementById('lootForm');
    
    form.addEventListener('submit', function(e) {
        const startTime = document.getElementById('start_time').value;
        const endTime = document.getElementById('end_time').value;
        const memberNames = document.querySelectorAll('input[name="member_name[]"]');
        const memberJoinTimes = document.querySelectorAll('input[name="member_join_time[]"]');
        
        let hasValidMembers = false;
        
        // Check if at least one member has both name and join time
        for (let i = 0; i < memberNames.length; i++) {
            if (memberNames[i].value.trim() && memberJoinTimes[i].value) {
                hasValidMembers = true;
                break;
            }
        }
        
        if (!hasValidMembers) {
            e.preventDefault();
            showAlert('Please add at least one valid party member with name and join time.', 'danger');
            return false;
        }
        
        // Validate time logic
        if (startTime && endTime) {
            const start = new Date('2000-01-01 ' + startTime);
            const end = new Date('2000-01-01 ' + endTime);
            
            // Allow for day rollover scenarios
            if (start.getTime() === end.getTime()) {
                e.preventDefault();
                showAlert('Start time and end time cannot be the same.', 'danger');
                return false;
            }
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Calculating...';
        submitBtn.disabled = true;
        
        // Re-enable button after a delay (in case of form errors)
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 5000);
    });
    
    // Helper function to show alerts
    function showAlert(message, type) {
        const alertContainer = document.querySelector('.container');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert after the flash messages area
        const flashArea = alertContainer.querySelector('.alert') || alertContainer.firstElementChild;
        flashArea.parentNode.insertBefore(alert, flashArea.nextSibling);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    // Auto-fill join time with start time when start time changes
    const startTimeInput = document.getElementById('start_time');
    startTimeInput.addEventListener('change', function() {
        const joinTimeInputs = document.querySelectorAll('input[name="member_join_time[]"]');
        joinTimeInputs.forEach(input => {
            if (!input.value) {
                input.value = this.value;
            }
        });
    });
    
    // Add fade out animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(-20px);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Smooth scroll to results if they exist
    const resultsSection = document.querySelector('.card:last-of-type');
    if (resultsSection && window.location.hash !== '#form') {
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
});
