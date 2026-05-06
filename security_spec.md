1. Data Invariants:
- A UserProfile belongs strictly to `request.auth.uid`.
- CustomLists belong to `request.auth.uid`.
- CalendarNotes belong to `request.auth.uid`.
- Only valid timestamps (request.time) or numbers are accepted. We'll use numbers (Date.now()) for simplicity or FieldValue.serverTimestamp(), but typically for JSON compatibility, users prefer integers. Let's enforce `data.updatedAt is number`. Wait, the instructions say "All timestamp fields (e.g. createdAt, updatedAt) MUST be strictly validated using the server timestamp request.time." Ok!
So `data.updatedAt == request.time` -> type would be timestamp.
Let's fix the schema blueprint to "type": "timestamp" conceptually, but we already wrote it.

2. Dirty Dozen Payloads:
- P1: Read someone else's UserProfile
- P2: Shadow field `isAdmin` injected to UserProfile 
- P3: `atcoderUsername` size > 100
- P4: `selectedColors` size > 20
- P5: `todoList` size > 1500
- P6: `minRating` is string
- P7: `name` size > 100 in CustomList
- P8: `problems` size > 2000 in CustomList
- P9: Update CustomList but modified someone else's data
- P10: `CalendarNote.note` size > 5000
- P11: `dateString` not valid format `YYYY-MM-DD` (ID poisoning)
- P12: Write to un-owned path `users/other/customLists/mine`

3. The Test Runner: We'll implement this if we ran the emulator, but we will write firestore.rules and strict validations based on this.
