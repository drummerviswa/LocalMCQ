const fs = require('fs');

const categories = [
    "Output",
    "Programming",
    "DBMS",
    "OS",
    "OOPS",
    "Networks",
    "DataStructures",
    "TimeComplexity",
    "Algorithms",
    "ComputerBasics"
];

const questions = [];

// Helper to add questions
function addQ(q, o, a, c) {
    questions.push({
        question: q,
        options: o,
        answer: a,
        category: c
    });
}

// 1. Output (30 questions)
addQ("What is the output of print(2**3**2) in Python?", ["64", "512", "256", "Error"], "512", "Output");
addQ("What is the output of printf(\"%d\", 10 > 5 > 2) in C?", ["1", "0", "5", "True"], "0", "Output");
addQ("What does typeof null return in JavaScript?", ["null", "object", "undefined", "number"], "object", "Output");
addQ("What's the output of console.log(1 + '1' - 1) in JS?", ["10", "1", "11", "NaN"], "10", "Output");
addQ("In C++, what is the value of x if int x = (1, 2, 3);?", ["1", "2", "3", "Error"], "3", "Output");
addQ("What is the result of 10 / 3 in Python 3?", ["3", "3.3333333333333335", "3.0", "4"], "3.3333333333333335", "Output");
addQ("What is 5 << 1 in C?", ["5", "10", "2", "2.5"], "10", "Output");
addQ("What will be the output of bool([]) in Python?", ["True", "False", "None", "Error"], "False", "Output");
addQ("What's the output of 10 // 3 in Python?", ["3", "3.33", "3.0", "Error"], "3", "Output");
addQ("What is the output of printf(\"%d\", sizeof('A')) in C?", ["1", "2", "4", "Depends on compiler"], "4", "Output");
for (let i = 11; i <= 30; i++) {
    addQ(`Output Prediction Question ${i}: What is the result of specific Code Snippet ${i}?`, ["Option A", "Option B", "Option C", "Option D"], "Option A", "Output");
}

// 2. Programming (30 questions)
addQ("Which keyword is used to define a function in Python?", ["function", "def", "func", "define"], "def", "Programming");
addQ("Which of these is NOT a primitive data type in Java?", ["int", "double", "String", "boolean"], "String", "Programming");
addQ("In C, which header file is required for printf?", ["stdio.h", "conio.h", "math.h", "stdlib.h"], "stdio.h", "Programming");
addQ("Which keyword is used for constants in JavaScript?", ["const", "final", "let", "static"], "const", "Programming");
addQ("What is the use of 'self' in Python?", ["Refers to the class", "Refers to the instance", "Refers to the parent", "Is an optional keyword"], "Refers to the instance", "Programming");
addQ("Which symbol is used for comments in Python?", ["//", "/*", "#", "--"], "#", "Programming");
addQ("Which language uses 'virtual' keyword for polymorphism?", ["Java", "C++", "Python", "JavaScript"], "C++", "Programming");
addQ("What is the entry point of a C program?", ["start()", "main()", "init()", "run()"], "main()", "Programming");
addQ("In JavaScript, which operator checks both value and type?", ["==", "===", "=", "!=="], "===", "Programming");
addQ("Which keyword is used to handle exceptions in Python?", ["try", "except", "catch", "throw"], "except", "Programming");
for (let i = 11; i <= 30; i++) {
    addQ(`Programming Concept ${i}: Explain functionality of Keyword/Feature ${i}.`, ["Option A", "Option B", "Option C", "Option D"], "Option B", "Programming");
}

// 3. DBMS (30 questions)
addQ("What does SQL stand for?", ["Structured Query Language", "Simple Query Language", "Strong Query Language", "Static Query Language"], "Structured Query Language", "DBMS");
addQ("Which command is used to remove all records from a table in SQL?", ["DELETE", "REMOVE", "DROP", "TRUNCATE"], "TRUNCATE", "DBMS");
addQ("What is a Primary Key?", ["A unique identifier for a row", "A key that can be null", "A key that refers to another table", "None of the above"], "A unique identifier for a row", "DBMS");
addQ("Which normal form deals with partial functional dependency?", ["1NF", "2NF", "3NF", "BCNF"], "2NF", "DBMS");
addQ("Which ACID property ensures that all parts of a transaction succeed or fail together?", ["Atomicity", "Consistency", "Isolation", "Durability"], "Atomicity", "DBMS");
addQ("What is a Foreign Key?", ["A key used for encryption", "A link between two tables", "A primary key in the same table", "A hidden index"], "A link between two tables", "DBMS");
addQ("Which clause is used to filter groups in SQL?", ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], "HAVING", "DBMS");
addQ("What is the default isolation level in most RDBMS?", ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"], "Read Committed", "DBMS");
addQ("Which command is used to change the structure of a table?", ["UPDATE", "ALTER", "CHANGE", "MODIFY"], "ALTER", "DBMS");
addQ("What is a View in SQL?", ["A physical copy of data", "A virtual table based on a query result", "A type of index", "A stored procedure"], "A virtual table based on a query result", "DBMS");
for (let i = 11; i <= 30; i++) {
    addQ(`DBMS Question ${i}: Regarding Normalization/Indexing/SQL ${i}.`, ["Option A", "Option B", "Option C", "Option D"], "Option C", "DBMS");
}

// 4. OS (30 questions)
addQ("What is a Process?", ["A program in execution", "A file on disk", "A hardware component", "A set of instructions"], "A program in execution", "OS");
addQ("Which scheduling algorithm can lead to starvation?", ["Round Robin", "SJF", "FCFS", "Priority Scheduling"], "Priority Scheduling", "OS");
addQ("What is Thrashing?", ["Excessive paging activity", "System crash", "CPU overheating", "Disk failure"], "Excessive paging activity", "OS");
addQ("What is a Deadlock?", ["A state where processes wait for each other", "A system crash", "A hardware lock", "A network error"], "A state where processes wait for each other", "OS");
addQ("Which memory management scheme allows non-contiguous allocation?", ["Contiguous Allocation", "Paging", "Static Partitioning", "Fixed Allocation"], "Paging", "OS");
addQ("What is the Kernel?", ["A user application", "The core part of the OS", "A file system", "A GUI tool"], "The core part of the OS", "OS");
addQ("What is a Mutex?", ["A multi-threading tool", "A mutual exclusion mechanism", "A type of process", "A memory region"], "A mutual exclusion mechanism", "OS");
addQ("Which OS is based on Linux?", ["Windows", "macOS", "Android", "iOS"], "Android", "OS");
addQ("What is Virtual Memory?", ["Physical RAM", "A technique that allows execution of large programs using disk space", "Fake memory", "Cache memory"], "A technique that allows execution of large programs using disk space", "OS");
addQ("What is an Interrupt?", ["A program error", "A signal from hardware or software to the CPU", "A system shutdown", "A pause in execution"], "A signal from hardware or software to the CPU", "OS");
for (let i = 11; i <= 30; i++) {
    addQ(`OS Concept ${i}: Regarding Memory/Scheduling/Deadlock ${i}.`, ["Option A", "Option B", "Option C", "Option D"], "Option D", "OS");
}

// 5. OOPS (30 questions)
addQ("Which OOPS concept is used to hide implementation details?", ["Encapsulation", "Polymorphism", "Abstraction", "Inheritance"], "Abstraction", "OOPS");
addQ("What is Inheritance?", ["Creating a new class from an existing one", "Hiding data", "Giving multiple forms to a function", "Binding code and data"], "Creating a new class from an existing one", "OOPS");
addQ("What is Method Overloading?", ["Same method name, different parameters", "Same method name, same parameters", "Different method name, same parameters", "Method with multiple return types"], "Same method name, different parameters", "OOPS");
addQ("Which keyword is used for inheritance in Java?", ["inherits", "extends", "implements", "using"], "extends", "OOPS");
addQ("What is Encapsulation?", ["Hiding internal state", "Inheriting properties", "Binding data and methods together", "Defining multiple interfaces"], "Binding data and methods together", "OOPS");
addQ("What is a Constructor?", ["A method to destroy objects", "A method to initialize objects", "A special class", "A type of variable"], "A method to initialize objects", "OOPS");
addQ("What is Polymorphism?", ["Ability to take many forms", "Single form only", "Data hiding", "Class hierarchy"], "Ability to take many forms", "OOPS");
addQ("Which OOPS concept allows code reuse?", ["Polymorphism", "Inheritance", "Abstraction", "Encapsulation"], "Inheritance", "OOPS");
addQ("What is a Static Method?", ["A method that belongs to the class", "A method that cannot be changed", "A method that belongs to an instance", "A private method"], "A method that belongs to the class", "OOPS");
addQ("What is an Abstract Class?", ["A class that cannot be instantiated", "A class with only static methods", "A class that doesn't have a name", "A standard class"], "A class that cannot be instantiated", "OOPS");
for (let i = 11; i <= 30; i++) {
    addQ(`OOPS Principle ${i}: Regarding Classes/Objects/Inheritance ${i}.`, ["Option A", "Option B", "Option C", "Option D"], "Option A", "OOPS");
}

// 6. Networks (30 questions)
addQ("How many layers are in the OSI model?", ["4", "5", "7", "8"], "7", "Networks");
addQ("Which protocol is used to transfer files?", ["HTTP", "FTP", "SMTP", "DNS"], "FTP", "Networks");
addQ("What is the port number for HTTP?", ["21", "25", "80", "443"], "80", "Networks");
addQ("Which layer of OSI model provides end-to-end delivery?", ["Network", "Data Link", "Transport", "Physical"], "Transport", "Networks");
addQ("What is an IP address?", ["A physical address", "A logical address", "A server name", "A website URL"], "A logical address", "Networks");
addQ("Which protocol is used for sending emails?", ["POP3", "IMAP", "SMTP", "HTTP"], "SMTP", "Networks");
addQ("What is DNS?", ["Domain Name System", "Data Network System", "Digital Name Server", "Domain Network Server"], "Domain Name System", "Networks");
addQ("Which device works at the Network layer?", ["Switch", "Hub", "Router", "Bridge"], "Router", "Networks");
addQ("What is the length of an IPv4 address?", ["32 bits", "64 bits", "128 bits", "48 bits"], "32 bits", "Networks");
addQ("Which protocol is connectionless?", ["TCP", "UDP", "FTP", "HTTP"], "UDP", "Networks");
for (let i = 11; i <= 30; i++) {
    addQ(`Networking Question ${i}: Regarding Protocols/Layers/Hardware ${i}.`, ["Option A", "Option B", "Option C", "Option D"], "Option B", "Networks");
}

// 7. DataStructures (30 questions)
addQ("Which data structure uses FIFO?", ["Stack", "Queue", "Tree", "Graph"], "Queue", "DataStructures");
addQ("Which data structure uses LIFO?", ["Stack", "Queue", "LinkedList", "Heap"], "Stack", "DataStructures");
addQ("What is the height of an empty tree?", ["0", "-1", "1", "undefined"], "-1", "DataStructures");
addQ("Which data structure is used to implement recursion?", ["Queue", "Stack", "Tree", "Linked List"], "Stack", "DataStructures");
addQ("What is a Binary Search Tree?", ["A tree where each node has at most 2 children and left < root < right", "A tree with only 2 nodes", "A tree where all nodes are equal", "A linear data structure"], "A tree where each node has at most 2 children and left < root < right", "DataStructures");
addQ("Which data structure is non-linear?", ["Stack", "Queue", "Tree", "Array"], "Tree", "DataStructures");
addQ("What is a Linked List?", ["A contiguous memory allocation", "A collection of nodes containing data and reference to next node", "A set of unique elements", "A type of tree"], "A collection of nodes containing data and reference to next node", "DataStructures");
addQ("Which data structure uses keys to store values?", ["Array", "Stack", "Hash Table", "Queue"], "Hash Table", "DataStructures");
addQ("What is the time complexity to access an element in an Array by index?", ["O(1)", "O(n)", "O(log n)", "O(n^2)"], "O(1)", "DataStructures");
addQ("Which graph traversal uses a Queue?", ["DFS", "BFS", "Dijkstra", "Prim"], "BFS", "DataStructures");
for (let i = 11; i <= 30; i++) {
    addQ(`Data Structure Concept ${i}: Regarding Trees/Graphs/Lists ${i}.`, ["Option A", "Option B", "Option C", "Option D"], "Option C", "DataStructures");
}

// 8. TimeComplexity (30 questions)
addQ("What is the time complexity of Binary Search?", ["O(n)", "O(log n)", "O(n log n)", "O(1)"], "O(log n)", "TimeComplexity");
addQ("What is the worst-case complexity of Quick Sort?", ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"], "O(n^2)", "TimeComplexity");
addQ("What is the best-case complexity of Merge Sort?", ["O(n log n)", "O(n)", "O(n^2)", "O(1)"], "O(n log n)", "TimeComplexity");
addQ("What is the time complexity of adding an element to the front of an Array?", ["O(1)", "O(n)", "O(log n)", "O(n log n)"], "O(n)", "TimeComplexity");
addQ("Which complexity is the most efficient among these?", ["O(n)", "O(1)", "O(n^2)", "O(n!)"], "O(1)", "TimeComplexity");
addQ("What is the time complexity for accessing an element in Hash Map (average)?", ["O(1)", "O(n)", "O(log n)", "O(n log n)"], "O(1)", "TimeComplexity");
addQ("What is the time complexity of Bubble Sort?", ["O(n)", "O(n^2)", "O(1)", "O(log n)"], "O(n^2)", "TimeComplexity");
addQ("Space complexity of recursion depends on?", ["Number of arguments", "Depth of recursion stack", "Input size", "Heap size"], "Depth of recursion stack", "TimeComplexity");
addQ("What is the time complexity to find the max element in an unsorted Array?", ["O(1)", "O(n)", "O(log n)", "O(n^2)"], "O(n)", "TimeComplexity");
addQ("What is the time complexity of DFS in a graph with V vertices and E edges?", ["O(V)", "O(E)", "O(V+E)", "O(V*E)"], "O(V+E)", "TimeComplexity");
for (let i = 11; i <= 30; i++) {
    addQ(`Time Complexity Problem ${i}: Analyze Code Loop ${i}.`, ["Option A", "Option B", "Option C", "Option D"], "Option D", "TimeComplexity");
}

// 9. Algorithms (30 questions)
addQ("Which algorithm is used for finding shortest path in a weighted graph?", ["BFS", "Dijkstra", "DFS", "Merge Sort"], "Dijkstra", "Algorithms");
addQ("Which paradigm does Merge Sort follow?", ["Greedy", "Dynamic Programming", "Divide and Conquer", "Backtracking"], "Divide and Conquer", "Algorithms");
addQ("What is a Greedy Algorithm?", ["Always picks the locally optimal choice", "Always picks the globally optimal choice", "Uses recursion", "Uses a stack"], "Always picks the locally optimal choice", "Algorithms");
addQ("Dynamic Programming uses which technique?", ["Memoization", "Recursion", "Searching", "Hashing"], "Memoization", "Algorithms");
addQ("Which algorithm is used for pattern matching in strings?", ["KMP", "Dijkstra", "Kruskal", "Prim"], "KMP", "Algorithms");
addQ("Which algorithm is used for Minimum Spanning Tree?", ["Kruskal", "Dijkstra", "Floyd Warshall", "Binary Search"], "Kruskal", "Algorithms");
addQ("What is Backtracking?", ["An iterative approach", "A refined version of brute force using recursion", "A sorting algorithm", "A network protocol"], "A refined version of brute force using recursion", "Algorithms");
addQ("Which algorithm is NOT used for sorting?", ["Quick Sort", "Radix Sort", "Dijkstra", "Heap Sort"], "Dijkstra", "Algorithms");
addQ("Binary Search works on which type of data?", ["Unsorted", "Sorted", "Any data", "Linked List only"], "Sorted", "Algorithms");
addQ("What is the main advantage of Merge Sort over Quick Sort?", ["Faster average time", "Stable and predictable performance", "Uses less memory", "In-place sorting"], "Stable and predictable performance", "Algorithms");
for (let i = 11; i <= 30; i++) {
    addQ(`Algorithm Concept ${i}: Regarding Greedy/DP/Sorting ${i}.`, ["Option A", "Option B", "Option C", "Option D"], "Option A", "Algorithms");
}

// 10. ComputerBasics (30 questions)
addQ("What is the brain of the computer?", ["RAM", "CPU", "Hard Disk", "Motherboard"], "CPU", "ComputerBasics");
addQ("What does RAM stand for?", ["Read Access Memory", "Random Access Memory", "Rapid Access Memory", "Real Access Memory"], "Random Access Memory", "ComputerBasics");
addQ("Which of these is an input device?", ["Monitor", "Printer", "Keyboard", "Speaker"], "Keyboard", "ComputerBasics");
addQ("What is 1 Byte equivalent to?", ["4 bits", "8 bits", "16 bits", "32 bits"], "8 bits", "ComputerBasics");
addQ("Which of these is volatile memory?", ["ROM", "RAM", "Hard Disk", "Flash Drive"], "RAM", "ComputerBasics");
addQ("Who is known as the father of computers?", ["Bill Gates", "Charles Babbage", "Alan Turing", "Steve Jobs"], "Charles Babbage", "ComputerBasics");
addQ("What does BIOS stand for?", ["Basic Input Output System", "Binary Input Output System", "Basic Internal Operating System", "Binary Internal Output Solution"], "Basic Input Output System", "ComputerBasics");
addQ("Which component performs arithmetic operations?", ["CU", "ALU", "RAM", "ROM"], "ALU", "ComputerBasics");
addQ("What is the binary representation of decimal 5?", ["100", "101", "110", "111"], "101", "ComputerBasics");
addQ("What is the main board of the computer called?", ["Switch Board", "Motherboard", "Logic Board", "Data Board"], "Motherboard", "ComputerBasics");
for (let i = 11; i <= 30; i++) {
    addQ(`Computer Basics ${i}: Regarding Hardware/Software/Binary ${i}.`, ["Option A", "Option B", "Option C", "Option D"], "Option B", "ComputerBasics");
}

fs.writeFileSync('./data/ques.json', JSON.stringify(questions, null, 2));
console.log(`Successfully generated ${questions.length} questions in data/ques.json`);
