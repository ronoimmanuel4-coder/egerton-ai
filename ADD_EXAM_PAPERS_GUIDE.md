# How to Add Your 5 Exam Papers

## Step 1: Get Your Course and Unit IDs

First, you need the IDs of your course and units. Login to your dashboard and check the browser console, or use this API:

```bash
# In PowerShell/CMD (while your server is running)
curl http://localhost:5000/api/courses
```

Or use Postman/Thunder Client to GET: `http://localhost:5000/api/courses`

Note down:
- Your `courseId` (e.g., `507f1f77bcf86cd799439011`)
- Your `unitId` for each unit (e.g., `507f1f77bcf86cd799439012`)

## Step 2: Add Exam Papers via API

Use Postman, Thunder Client, or PowerShell to add each exam paper.

### Example: Adding Exam Paper 1

```json
POST http://localhost:5000/api/exam-papers
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_TOKEN_HERE

Body:
{
  "courseId": "YOUR_COURSE_ID",
  "unitId": "YOUR_UNIT_ID",
  "year": 2,
  "semester": 1,
  "examYear": 2023,
  "examType": "Final",
  "lecturer": "Dr. John Kamau",
  "fullText": "EGERTON UNIVERSITY\nFACULTY OF SCIENCE\nEXAM: CSC 204 - DATA STRUCTURES\n\nSECTION A: Answer ALL questions\n\n1. Define a binary search tree and explain its properties. (10 marks)\n\n2. Write an algorithm to implement bubble sort. (15 marks)\n\n3. Compare and contrast stacks and queues. Give real-world examples. (10 marks)\n\nSECTION B: Answer ANY TWO questions\n\n4. Explain the concept of recursion with examples. (20 marks)\n\n5. Implement a linked list in pseudocode. (20 marks)",
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Define a binary search tree and explain its properties.",
      "marks": 10,
      "section": "Section A",
      "type": "Short Answer"
    },
    {
      "questionNumber": 2,
      "questionText": "Write an algorithm to implement bubble sort.",
      "marks": 15,
      "section": "Section A",
      "type": "Problem Solving"
    },
    {
      "questionNumber": 3,
      "questionText": "Compare and contrast stacks and queues. Give real-world examples.",
      "marks": 10,
      "section": "Section A",
      "type": "Essay"
    }
  ],
  "topics": ["Binary Search Trees", "Sorting Algorithms", "Stacks", "Queues", "Recursion", "Linked Lists"],
  "difficulty": "Moderate"
}
```

### PowerShell Example

```powershell
# Get your token after logging in
$token = "YOUR_TOKEN_HERE"

# Prepare exam paper data
$examPaper = @{
  courseId = "YOUR_COURSE_ID"
  unitId = "YOUR_UNIT_ID"
  year = 2
  semester = 1
  examYear = 2023
  examType = "Final"
  lecturer = "Dr. John Kamau"
  fullText = "EGERTON UNIVERSITY`nFACULTY OF SCIENCE`nEXAM: CSC 204 - DATA STRUCTURES`n`nSECTION A: Answer ALL questions`n`n1. Define a binary search tree and explain its properties. (10 marks)`n`n2. Write an algorithm to implement bubble sort. (15 marks)"
  topics = @("Binary Search Trees", "Sorting Algorithms", "Stacks", "Queues")
  difficulty = "Moderate"
} | ConvertTo-Json

# Send request
$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/exam-papers" -Method Post -Body $examPaper -Headers $headers
```

## Step 3: Repeat for All 5 Exam Papers

Add each of your 5 exam papers with their:
- Full text (copy-paste from your PDF/Word document)
- Lecturer name
- Topics covered
- Questions (optional but helpful)
- Year and semester

## Step 4: Verify

Check that your exam papers were added:

```bash
GET http://localhost:5000/api/exam-papers/course/YOUR_COURSE_ID
Headers:
  Authorization: Bearer YOUR_TOKEN
```

## Quick Template for Your 5 Papers

```json
// Paper 1
{
  "courseId": "",
  "unitId": "",
  "year": 2,
  "semester": 1,
  "examYear": 2023,
  "lecturer": "",
  "fullText": "PASTE_EXAM_HERE",
  "topics": ["Topic1", "Topic2"],
  "difficulty": "Moderate"
}

// Paper 2
{
  "courseId": "",
  "unitId": "",
  "year": 2,
  "semester": 2,
  "examYear": 2023,
  "lecturer": "",
  "fullText": "PASTE_EXAM_HERE",
  "topics": ["Topic1", "Topic2"],
  "difficulty": "Hard"
}

// Repeat for Papers 3, 4, 5...
```

## What Happens Next?

Once you add the exam papers:
1. The AI will have access to them during conversations
2. AI will analyze patterns in lecturer's questions
3. AI will predict likely exam questions
4. AI will tailor study guidance based on past exams
5. AI will challenge students with questions similar to exam style

## Need Help?

If you get errors:
1. Make sure server is running: `npm run dev` in server folder
2. Check your token is valid (login again if needed)
3. Verify courseId and unitId exist in database
4. Check server logs for detailed error messages
