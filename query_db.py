import sqlite3

def main():
    conn = sqlite3.connect("backend/scheduler.db")
    cursor = conn.cursor()
    print("====================================================")
    print("Connected to SQLite database: backend/scheduler.db")
    print("Type your SQL query (e.g., 'SELECT * FROM users;')")
    print("Type 'exit' or 'quit' to close the connection.")
    print("====================================================")

    while True:
        try:
            query = input("sql> ").strip()
            if query.lower() in ("exit", "quit"):
                break
            if not query:
                continue
            
            cursor.execute(query)
            
            # If it's a SELECT query, print the results nicely
            if query.lower().startswith("select"):
                rows = cursor.fetchall()
                if not rows:
                    print("No results returned.")
                    continue
                
                # Fetch and print column headers
                colnames = [desc[0] for desc in cursor.description]
                header = " | ".join(colnames)
                print(header)
                print("-" * len(header))
                for row in rows:
                    print(" | ".join(str(val) for val in row))
            else:
                conn.commit()
                print(f"Query executed successfully. Rows affected: {cursor.rowcount}")
        except Exception as e:
            print(f"Error: {e}")
        print()

    conn.close()

if __name__ == "__main__":
    main()
