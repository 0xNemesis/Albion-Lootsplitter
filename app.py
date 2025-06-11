import os
import logging
from datetime import datetime, time
from flask import Flask, render_template, request, flash, redirect, url_for

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "albion-loot-calculator-secret-key")

def parse_time(time_str):
    """Parse time string in HH:MM format to datetime.time object"""
    try:
        return datetime.strptime(time_str, "%H:%M").time()
    except ValueError:
        return None

def calculate_participation_minutes(start_time, end_time, join_time):
    """Calculate participation minutes for a member"""
    # Convert times to minutes from midnight for easier calculation
    start_minutes = start_time.hour * 60 + start_time.minute
    end_minutes = end_time.hour * 60 + end_time.minute
    join_minutes = join_time.hour * 60 + join_time.minute
    
    # Handle day rollover
    if end_minutes < start_minutes:
        end_minutes += 24 * 60
        if join_minutes < start_minutes:
            join_minutes += 24 * 60
    
    # Calculate actual participation
    actual_start = max(start_minutes, join_minutes)
    participation_minutes = max(0, end_minutes - actual_start)
    
    return participation_minutes

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        try:
            # Get form data
            total_silver = request.form.get('total_silver', type=int)
            start_time_str = request.form.get('start_time')
            end_time_str = request.form.get('end_time')
            
            # Validate required fields
            if not all([total_silver, start_time_str, end_time_str]):
                flash('Please fill in all required fields.', 'error')
                return redirect(url_for('index'))
            
            if total_silver <= 0:
                flash('Total silver must be greater than 0.', 'error')
                return redirect(url_for('index'))
            
            # Parse times
            start_time = parse_time(start_time_str)
            end_time = parse_time(end_time_str)
            
            if not start_time or not end_time:
                flash('Invalid time format. Please use HH:MM format (e.g., 14:30).', 'error')
                return redirect(url_for('index'))
            
            # Get member data
            member_names = request.form.getlist('member_name[]')
            member_join_times = request.form.getlist('member_join_time[]')
            
            if not member_names or not member_join_times:
                flash('Please add at least one party member.', 'error')
                return redirect(url_for('index'))
            
            # Process members and calculate distribution
            members = []
            total_participation = 0
            
            for name, join_time_str in zip(member_names, member_join_times):
                if not name.strip() or not join_time_str:
                    continue
                
                join_time = parse_time(join_time_str)
                if not join_time:
                    flash(f'Invalid join time format for {name}. Please use HH:MM format.', 'error')
                    return redirect(url_for('index'))
                
                participation_minutes = calculate_participation_minutes(start_time, end_time, join_time)
                
                if participation_minutes > 0:
                    members.append({
                        'name': name.strip(),
                        'join_time': join_time_str,
                        'participation_minutes': participation_minutes
                    })
                    total_participation += participation_minutes
            
            if not members:
                flash('No valid party members found with participation time.', 'error')
                return redirect(url_for('index'))
            
            # Calculate silver distribution
            for member in members:
                participation_ratio = member['participation_minutes'] / total_participation
                member['silver_share'] = int(total_silver * participation_ratio)
                member['participation_percentage'] = round(participation_ratio * 100, 1)
            
            # Calculate session duration
            session_start_minutes = start_time.hour * 60 + start_time.minute
            session_end_minutes = end_time.hour * 60 + end_time.minute
            if session_end_minutes < session_start_minutes:
                session_end_minutes += 24 * 60
            session_duration = session_end_minutes - session_start_minutes
            
            return render_template('index.html', 
                                 results={
                                     'total_silver': total_silver,
                                     'start_time': start_time_str,
                                     'end_time': end_time_str,
                                     'session_duration': session_duration,
                                     'members': members,
                                     'total_distributed': sum(m['silver_share'] for m in members)
                                 })
        
        except Exception as e:
            app.logger.error(f"Error processing loot calculation: {e}")
            flash('An error occurred while calculating the loot distribution. Please check your inputs.', 'error')
            return redirect(url_for('index'))
    
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
