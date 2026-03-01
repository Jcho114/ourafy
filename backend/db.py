import sqlite3

def create_db_conn():
    return sqlite3.connect('ourafy.db')

def init_db():
    with create_db_conn() as conn:
        cursor = conn.cursor()

        cursor.execute('''
                CREATE TABLE IF NOT EXISTS biometrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    score INTEGER,
                    activity_balance INTEGER,
                    body_temperature REAL,
                    hrv_balance INTEGER,
                    recovery_index INTEGER,
                    resting_heart_rate INTEGER,
                    sleep_balance INTEGER,
                    sleep_regularity INTEGER,
                    deep_sleep INTEGER,
                    efficiency INTEGER,
                    latency INTEGER,
                    rem_sleep INTEGER,
                    restfulness INTEGER,
                    timing INTEGER,
                    total_sleep INTEGER,
                    day_summary TEXT,
                    stress_high INTEGER
                )
            ''')
        
        cursor.execute('''
                CREATE TABLE IF NOT EXISTS formula_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    composite_focus_capacity REAL,
                    neurocognitive_readiness REAL,
                    autonomic_balance_ratio REAL,
                    lock_in_score REAL
                )
            ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS pomorodo_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mode TEXT,              
                task_name TEXT,
                category TEXT,
                date TEXT,                -- YYYY-MM-DD HH:MM
                interval_minutes INTEGER,
                break_minutes INTEGER,
                completed BOOLEAN
            )
        ''')
        
        # saving changes
        conn.commit()

def sync_oura_data(tablename, data):

    with create_db_conn() as conn:
        cursor = conn.cursor()

        # preparing the columns and placeholders dynamically
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?'] * len(data))
        values = tuple(data.values())

        # inserting the data
        sql = f"INSERT INTO {tablename} ({columns}) VALUES ({placeholders})"
        cursor.execute(sql, values)

        conn.commit()


init_db()