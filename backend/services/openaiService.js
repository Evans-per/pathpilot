const axios = require('axios');

/**
 * Generate a personalized roadmap using OpenAI API
 * Falls back to high-quality local mock generator if API key is missing or fails
 */
exports.generateRoadmap = async (onboardingData, userApiKey = null) => {
  const { interest, level, deadlineValue, deadlineUnit, dailyHours, learningStyle, existingSkills } = onboardingData;
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;

  const prompt = `You are an elite learning assistant. Create a personalized learning roadmap for a student.
Student Profile:
- Interest: ${interest}
- Current Level: ${level}
- Timeline: ${deadlineValue} ${deadlineUnit}
- Daily Study Budget: ${dailyHours} hours (${dailyHours * 7} hours/week)
- Learning Style: ${learningStyle}
- Existing Skills: ${existingSkills && existingSkills.length > 0 ? existingSkills.join(', ') : 'None'}

You must respond in STRICTOR JSON format matching this schema:
{
  "summary": "A 2-3 sentence overview of the roadmap objectives and final target outcome.",
  "roadmap": [
    {
      "week": 1,
      "goal": "Goal of this week",
      "topics": ["Specific topic 1 to search on YouTube", "Specific topic 2 to search on YouTube"],
      "concepts": ["Key concept 1", "Key concept 2"],
      "practice": ["Hands-on practice task 1", "Hands-on practice task 2"],
      "mini_project": "Weekly micro project title and description",
      "estimated_hours": 10
    }
  ]
}

Ensure the number of weeks in the roadmap aligns with the requested timeline of ${deadlineValue} ${deadlineUnit}. Include a final project in the final week.
Do not wrap your response in markdown code blocks. Return raw JSON only.`;

  if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an educational planner that outputs ONLY raw JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          timeout: 20000
        }
      );

      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (error) {
      console.error('OpenAI Roadmap API Call failed, initiating mock fallback:', error.message);
      // Fall through to mock generator
    }
  }

  return generateMockRoadmap(interest, level, deadlineValue, deadlineUnit, dailyHours, learningStyle, existingSkills);
};

/**
 * Handle chatbot completions with context
 */
exports.getChatCompletion = async (userMessage, chatHistory, context) => {
  const { roadmap, completedTasks, currentWeek, userProfile } = context;
  const apiKey = userProfile?.customApiKey || process.env.OPENAI_API_KEY;

  const systemPrompt = `You are PathPilot's AI Learning Assistant. You are guiding ${userProfile.name} through a personalized learning roadmap.
User Profile:
- Interest: ${userProfile.onboardingData?.interest || 'General'}
- Current Level: ${userProfile.onboardingData?.level || 'Beginner'}
- Active Week: Week ${currentWeek || 1}
- Completed items: ${completedTasks ? completedTasks.length : 0} tasks completed.

Current active week goal: "${roadmap?.roadmap?.find(w => w.week === currentWeek)?.goal || 'Setup study routine'}"
Active topics: ${JSON.stringify(roadmap?.roadmap?.find(w => w.week === currentWeek)?.topics || [])}

Capabilities:
1. Explain technical concepts in simple terms with examples.
2. Answer doubts and debug code.
3. Suggest next study actions based on their current roadmap.
4. Keep the user highly motivated, confident, and focused.

Keep answers concise, clear, formatted in clean Markdown, and target the student's level (${userProfile.onboardingData?.level || 'Beginner'}).`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    })),
    { role: 'user', content: userMessage }
  ];

  if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          timeout: 10000
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Chat API Call failed, initiating mock fallback:', error.response?.data || error.message);
      if (error.response && error.response.status === 429) {
        const mockReply = generateMockChatResponse(userMessage, context);
        return `⚠️ **OpenAI API Notice (Quota Exceeded)**
It looks like the configured OpenAI API key has run out of credit or has expired.

To help you keep learning, I have activated the **PathPilot Local Assistant Fallback**:
***
${mockReply}`;
      }
      // Fall through to mock response
    }
  }

  return generateMockChatResponse(userMessage, context);
};

/**
 * Generate an optimized YouTube search query for a topic
 */
exports.generateSearchQuery = async (topic, level = 'Beginner', interest = '') => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are an elite search optimizer. Output ONLY a single optimized YouTube search query. Do not wrap in quotes or code blocks, and output no explanations.' 
            },
            { 
              role: 'user', 
              content: `Create the best search query to find a long-form YouTube course/tutorial on this topic: "${topic}". The student level is "${level}" in the subject "${interest}".` 
            }
          ],
          temperature: 0.5,
          max_tokens: 30
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          timeout: 5000
        }
      );
      return response.data.choices[0].message.content.trim().replace(/^"|"$/g, '');
    } catch (error) {
      console.error('OpenAI Search query optimizer failed:', error.message);
    }
  }
  // Fallback
  return `${topic} ${level} full course tutorial`;
};

// ==========================================
// MOCK GENERATOR ENGINE FOR LOCAL WORKSHOPS
// ==========================================

function generateMockRoadmap(interest, level, deadlineValue, deadlineUnit, dailyHours, learningStyle, existingSkills) {
  const totalWeeks = deadlineUnit === 'months' ? deadlineValue * 4 : deadlineValue;
  const weeklyHours = dailyHours * 7;

  // Let's create high quality mock curricula
  const curricula = {
    'AI': [
      { goal: 'Introduction to Python & Math for AI', topics: ['Python Programming Basics', 'Linear Algebra for Machine Learning', 'NumPy and Pandas Tutorial'], concepts: ['Variables & Loops', 'Matrices & Vectors', 'Dataframes & Data Cleaning'], practice: ['Write basic calculator script', 'Perform matrix multiplications', 'Analyze a CSV using Pandas'] },
      { goal: 'Data Processing & Statistics', topics: ['Data Visualization Matplotlib Seaborn', 'Exploratory Data Analysis EDA', 'Probability & Statistics for Data Science'], concepts: ['Histograms & Scatter Plots', 'Standard Deviation & Correlation', 'Bayes Theorem & Normal Distribution'], practice: ['Plot housing price dataset charts', 'Clean a messy dataset', 'Calculate Z-scores of exam grades'] },
      { goal: 'Classical Machine Learning', topics: ['Supervised Learning Algorithms', 'Linear and Logistic Regression', 'Scikit-Learn Tutorial for Beginners'], concepts: ['Overfitting vs Underfitting', 'Cost Functions & Gradient Descent', 'Model Evaluation metrics Precision Recall'], practice: ['Build a house price predictor', 'Train a spam email classifier', 'Tune hyperparameters of random forest'] },
      { goal: 'Unsupervised & Deep Learning Foundations', topics: ['Unsupervised Learning K-Means Clustering', 'Introduction to Neural Networks', 'PyTorch Tutorial for Beginners'], concepts: ['Clustering vs Classification', 'Neurons, Weights & Activation Functions', 'Backpropagation'], practice: ['Cluster customers by purchasing habits', 'Implement a simple neuron in Python', 'Build a PyTorch linear regression model'] },
      { goal: 'Computer Vision & Deep Learning', topics: ['Convolutional Neural Networks CNN', 'Image Classification PyTorch', 'OpenCV Basics Tutorial'], concepts: ['Convolution & Pooling Layers', 'Feature Extraction', 'Image Manipulation'], practice: ['Train MNIST handwritten digit classifier', 'Build an image filter with OpenCV', 'Use a pre-trained ResNet model'] },
      { goal: 'Natural Language Processing (NLP)', topics: ['Natural Language Processing NLP Basics', 'Tokenization and Text Preprocessing', 'Recurrent Neural Networks LSTM'], concepts: ['Word Embeddings Word2Vec', 'Sequence-to-Sequence models', 'Sentiment Analysis'], practice: ['Analyze movie review sentiments', 'Build a simple text generator', 'Build a regex token parser'] },
      { goal: 'Transformers & Large Language Models', topics: ['Attention Mechanism & Transformers', 'Hugging Face Transformers Tutorial', 'Fine tuning LLM models'], concepts: ['Self-Attention & Multi-Head Attention', 'Pre-trained models API usage', 'Prompt Engineering'], practice: ['Build Q&A system using Hugging Face', 'Create LLM prompt agent template', 'Build RAG system draft'] },
      { goal: 'Advanced AI Project Deployment', topics: ['Model Deployment Streamlit Fastapi', 'Machine Learning Operations MLOps', 'Docker for ML Models'], concepts: ['REST APIs', 'Model Versioning & Monitoring', 'Containerization'], practice: ['Create Streamlit web UI for classifier', 'Dockerize a FastAPI model endpoint', 'Deploy model to Render/HuggingFace Spaces'] }
    ],
    'Software Engineering': [
      { goal: 'Command Line, Git & Programming Foundations', topics: ['Git Version Control Tutorial', 'Linux Command Line Basics', 'Advanced Programming Concepts'], concepts: ['Repository, Commit & Merge', 'Bash Navigation & Commands', 'Memory Management & OOP basics'], practice: ['Initialize Git repo and resolve merge conflict', 'Write custom Bash deployment script', 'Construct complex class hierachies'] },
      { goal: 'Data Structures and Algorithms Core', topics: ['Data Structures Big O Notation', 'Arrays and Linked Lists Tutorial', 'Sorting and Searching Algorithms'], concepts: ['Time & Space Complexity', 'Nodes & Pointers', 'Recursion & Binary Search'], practice: ['Implement singly linked list', 'Code bubble sort and merge sort', 'Write recursive Fibonacci function'] },
      { goal: 'Object Oriented Design & Patterns', topics: ['Object Oriented Programming OOP Java C#', 'SOLID Design Principles', 'Design Patterns for Beginners'], concepts: ['Inheritance, Polymorphism, Encapsulation', 'Single Responsibility, Open-Closed', 'Singleton, Factory, Observer Patterns'], practice: ['Design a library database system class structure', 'Refactor code to conform to SOLID', 'Implement Factory pattern for payment app'] },
      { goal: 'Database Systems & SQL', topics: ['Relational Database SQL Tutorial', 'Database Normalization and Joins', 'PostgreSQL Tutorial'], concepts: ['Tables, Schemas, Foreign Keys', 'One-to-Many & Many-to-Many relationships', 'Indexing & Transactions'], practice: ['Write complex SQL queries with JOINs', 'Normalize a schema to 3NF', 'Configure local PostgreSQL database'] },
      { goal: 'Software Testing & Quality Assurance', topics: ['Software Testing Unit Integration E2E', 'Jest Testing Tutorial JavaScript', 'Test Driven Development TDD'], concepts: ['Mocks, Spies & Assertions', 'Code Coverage', 'CI/CD Pipelines basics'], practice: ['Write unit tests for utility functions', 'Code a feature using strict TDD', 'Configure Github Actions test runner'] },
      { goal: 'System Architecture & Design', topics: ['System Design Prime Concepts', 'REST API Design Best Practices', 'Microservices vs Monolith'], concepts: ['Load Balancers & Caching', 'Horizontal vs Vertical Scaling', 'API Gateways & Message Queues'], practice: ['Draw system diagram for Instagram clone', 'Design REST API contract for e-commerce', 'Implement Docker-compose for two services'] },
      { goal: 'Agile Methodologies & DevOps Basics', topics: ['Agile Scrum Kanban Tutorial', 'Docker Containers Tutorial', 'CI CD Pipelines Jenkins Actions'], concepts: ['Sprints & Standups', 'Containers vs Virtual Machines', 'Continuous Deployment'], practice: ['Create a Scrum board for final project', 'Write custom Dockerfile for node app', 'Deploy app to AWS or Render'] },
      { goal: 'Capstone Software Engineering Project', topics: ['Software Architecture Capstone Project', 'Production Deployment Checklist', 'Performance Profiling Tuning'], concepts: ['Full System Integration', 'Security Hardening', 'Caching Redis'], practice: ['Optimize database query execution plans', 'Write comprehensive post-mortem report', 'Launch project on production cloud provider'] }
    ],
    'Web Development': [
      { goal: 'HTML5, CSS3 & Responsive Design', topics: ['HTML5 Tutorial for Beginners', 'CSS Grid and Flexbox Layouts', 'Responsive Web Design Media Queries'], concepts: ['Semantic Elements & DOM', 'Box Model, Flexbox vs Grid', 'Mobile-First Design approach'], practice: ['Code a semantic landing page wireframe', 'Build complex responsive layout grid', 'Create css-only animated toggle switch'] },
      { goal: 'JavaScript ES6+ & DOM Manipulation', topics: ['JavaScript ES6 Tutorial', 'Asynchronous JavaScript Promises Async Await', 'DOM Manipulation Event Listeners'], concepts: ['Arrow Functions & Destructuring', 'Callback Queue & Event Loop', 'Fetch API & JSON parsing'], practice: ['Create dynamic interactive To-Do App', 'Fetch weather data from public API', 'Build a stopwatch timer utility'] },
      { goal: 'React.js Fundamentals', topics: ['React JS Crash Course', 'React Components State Props', 'React Hooks useState useEffect'], concepts: ['Virtual DOM', 'Unidirectional Data Flow', 'Hooks Lifecycle'], practice: ['Build counter application with history logs', 'Create user card directory from API data', 'Create custom validation hook'] },
      { goal: 'Advanced React & Routing', topics: ['React Router DOM Tutorial', 'React Context API State Management', 'React Tailwind CSS Integration'], concepts: ['Single Page Application SPA', 'Global State Context', 'Tailwind Utilities'], practice: ['Implement multi-page app with React Router', 'Build shopping cart checkout state', 'Design modern glassmorphism landing layout'] },
      { goal: 'Node.js & Express.js Backend', topics: ['Node.js Express crash course', 'REST API development Node', 'MongoDB Mongoose Tutorial'], concepts: ['Server-Client Architecture', 'Middlewares (CORS, Error handlers)', 'Schemas and Queries'], practice: ['Set up basic Express listener', 'Create CRUD API endpoints for tasks', 'Connect Node to local MongoDB'] },
      { goal: 'Web Authentication & Security', topics: ['JWT Authentication Tutorial Node', 'Bcrypt password hashing Node', 'Web Security OWASP Top 10'], concepts: ['JSON Web Tokens, Refresh Tokens', 'Salting and Hashing', 'XSS & CSRF Prevention'], practice: ['Create Secure Login/Register API', 'Implement Protected routes in React client', 'Sanitize and rate limit API requests'] },
      { goal: 'Advanced State Management & Testing', topics: ['Redux Toolkit Tutorial React', 'React Testing Library Jest', 'Vite Production Build Optimization'], concepts: ['Redux Store, Slices & Thunks', 'Unit Testing Components', 'Lazy Loading & Code Splitting'], practice: ['Migrate shopping cart context to Redux Toolkit', 'Write test suites for login forms', 'Implement React.lazy dynamic page imports'] },
      { goal: 'Full Stack Integration & Launch', topics: ['Full Stack MERN deployment', 'Vercel frontend deployment', 'Render backend deployment'], concepts: ['Environment variables configuration', 'CORS origin whitelisting', 'Production Build Pipelines'], practice: ['Deploy Backend API to Render Cloud', 'Deploy React App to Vercel client', 'Create full-stack project portfolio presentation'] }
    ],
    'Data Science': [
      { goal: 'Python Foundations for Data Science', topics: ['Python for Data Science Beginners', 'NumPy Arrays Tutorial', 'Pandas DataFrame Basics'], concepts: ['Lists, Dicts, List Comprehensions', 'Vectorized Operations', 'Data Filtering, Merging, Grouping'], practice: ['Write Python sales aggregation script', 'Clean missing entries in client records', 'Create stats calculations on NumPy data'] },
      { goal: 'Data Collection & SQL Databases', topics: ['SQL for Data Analytics Tutorial', 'Web Scraping Beautiful Soup Python', 'API Data Retrieval Python'], concepts: ['SQL SELECT, Joins, Aggregations', 'HTML Parsing & Web Scraping rules', 'HTTP requests & rate limits'], practice: ['Extract quotes from scrapable website', 'Fetch weather history using REST API', 'Write SQL reports on database transactions'] },
      { goal: 'Data Cleaning & Exploratory Data Analysis', topics: ['Exploratory Data Analysis EDA Python', 'Handling Missing Data Outliers Pandas', 'Data Visualization Seaborn Plotly'], concepts: ['Data Distributions & Skewness', 'Imputation Methods', 'Interactive charts'], practice: ['Generate data profiling report', 'Identify and clip outliers in housing records', 'Produce scatter-matrix dashboards'] },
      { goal: 'Applied Mathematics & Statistics', topics: ['Probability Statistics for Data Science', 'Hypothesis Testing A B Testing Python', 'Linear Algebra for Machine Learning'], concepts: ['Hypothesis, P-Values, T-Tests', 'Statistical Significance', 'Eigenvalues & Vectors'], practice: ['Conduct A/B test analysis on CTA clicks', 'Calculate statistical confidence intervals', 'Write matrix transformations in NumPy'] },
      { goal: 'Supervised Learning Algorithms', topics: ['Machine Learning algorithms Scikit-Learn', 'Linear and Logistic Regression Tutorial', 'Decision Trees Random Forest Scikit-Learn'], concepts: ['Training vs Validation sets', 'Confusion Matrix, F1 Score', 'Ensemble Learning'], practice: ['Predict employee turnover likelihood', 'Train credit risk assessment model', 'Compare classification accuracy metrics'] },
      { goal: 'Unsupervised Learning & Clustering', topics: ['K-Means Clustering Tutorial Scikit-Learn', 'Principal Component Analysis PCA python', 'Anomaly Detection Algorithms'], concepts: ['Centroids & Inertia', 'Dimensionality Reduction', 'Unsupervised outliers'], practice: ['Segment supermarket shoppers by spending profiles', 'Compress 30 dimensions to 2 components via PCA', 'Identify fraudulent bank transaction logs'] },
      { goal: 'Time Series & Big Data Foundations', topics: ['Time Series Analysis Forecasting Python', 'Introduction to Apache Spark PySpark', 'SQL Window Functions Analytics'], concepts: ['Trend, Seasonality, Stationarity', 'Resilient Distributed Datasets RDD', 'Window Aggregations'], practice: ['Forecast weekly stock prices using ARIMA/Prophet', 'Process large CSV logs via PySpark sessions', 'Write SQL queries using Lead/Lag, Rank'] },
      { goal: 'Data Science Capstone Deployment', topics: ['Data Science Dashboard Streamlit', 'Deploying ML models FastAPI', 'Docker for Data Science'], concepts: ['Model serialization (joblib, pickle)', 'Web Dashboard layouts', 'Containerized data pipelines'], practice: ['Build interactive Streamlit dashboard', 'Create FastAPI model predictor endpoint', 'Deploy completed notebook as a web app'] }
    ],
    'DSA': [
      { goal: 'Complexity Analysis & Basic Structures', topics: ['Big O Notation Time Complexity', 'Arrays and Dynamic Arrays Tutorial', 'Singly and Doubly Linked Lists'], concepts: ['Constant, Logarithmic, Linear, Quadratic time', 'Memory Allocations', 'Node Traversal, Pointers'], practice: ['Analyze Big O of custom algorithms', 'Write custom dynamic array class', 'Implement doubly linked list deletion'] },
      { goal: 'Stacks, Queues & Recursion', topics: ['Stack and Queue Data Structure', 'Recursion Tutorial for Beginners', 'Backtracking Algorithms Introduction'], concepts: ['LIFO vs FIFO systems', 'Call Stack & Base Case', 'Recursion tree, N-Queens basics'], practice: ['Implement stack using array and queue', 'Write recursive binary search function', 'Solve simple Sudoku solver using backtracking'] },
      { goal: 'Sorting & Searching Algorithms', topics: ['Sorting Algorithms Merge Sort Quick Sort', 'Binary Search Tree traversals', 'Two Pointers Techniques'], concepts: ['Divide and Conquer', 'Pivot selection & partition', 'Sorted Arrays operations'], practice: ['Write Quick Sort and analyze stack depth', 'Search target in rotated sorted array', 'Solve 3Sum problem using two pointers'] },
      { goal: 'Hash Tables & String Algorithms', topics: ['Hash Table Data Structure Implementation', 'String Manipulation Algorithms', 'Sliding Window Technique DSA'], concepts: ['Hash Functions, Hash Collisions', 'ASCII values & Anagram checkers', 'Subarrays matching'], practice: ['Implement custom hash map with chaining', 'Solve Longest Substring Without Repeating Characters', 'Build sliding window window-max calculator'] },
      { goal: 'Trees & Graphs Foundations', topics: ['Binary Search Tree BST tutorial', 'Breadth First Search BFS Graphs', 'Depth First Search DFS Graphs'], concepts: ['BST Insert, Delete, Balance', 'Adjacency List vs Adjacency Matrix', 'Graph Traversal & Cycle Detection'], practice: ['Check if binary tree is height-balanced', 'Implement BFS to find shortest path', 'Detect cycles in directed graph using DFS'] },
      { goal: 'Advanced Trees & Shortest Paths', topics: ['Dijkstra Algorithm Shortest Path Graph', 'Min Spanning Tree Prim Kruskal', 'Trie Data Structure Auto-complete'], concepts: ['Priority Queues / Heaps', 'Greedy Choice Property', 'Prefix Trees matching'], practice: ['Implement Dijkstra\'s algorithm', 'Build Prim\'s minimum spanning tree', 'Write Trie class with insert and search'] },
      { goal: 'Dynamic Programming (DP) Basics', topics: ['Dynamic Programming Tutorial for Beginners', 'Memoization vs Tabulation DP', 'Classic DP Problems knapsack'], concepts: ['Overlapping Subproblems', 'Optimal Substructure', 'State transitions'], practice: ['Solve Knapsack problem using tabulation', 'Solve Longest Common Subsequence (LCS)', 'Solve Coin Change problem'] },
      { goal: 'Advanced DSA & Interview Patterns', topics: ['Top DSA Interview Questions Cheat Sheet', 'Bit Manipulation Tutorial', 'Union Find Disjoint Set Union'], concepts: ['Disjoint sets, path compression', 'Bitwise AND, OR, XOR operations', 'Sliding window / Monotonic Queue patterns'], practice: ['Implement Disjoint Set Union class', 'Write bitwise checkers for power-of-two', 'Resolve 5 hard LeetCode problems'] }
    ],
    'Creative3D': [
      { goal: '3D Interface, Navigation & Basic Mesh Modeling', topics: ['Blender 3D Modeling Tutorial for Beginners', '3D Navigation and Interface Basics', 'Extruding and Beveling Meshes in Blender'], concepts: ['3D Coordinate Space X Y Z', 'Vertices, Edges, and Faces', 'Edit Mode vs Object Mode'], practice: ['Model a low-poly coffee cup', 'Model a basic chair and table', 'Configure custom viewport layout keys'] },
      { goal: 'Materials, Textures, UV Mapping & Shading', topics: ['Blender Material Shaders Tutorial', 'UV Unwrapping Basics for Beginners', 'PBR Textures and Texture Coordinates'], concepts: ['Principled BSDF Shader', 'UV Seams and Layouts', 'Normal maps, Roughness, and Albedo'], practice: ['UV unwrap the coffee cup model', 'Apply wood texture shader to the table', 'Paint custom textures in texture painting mode'] },
      { goal: 'Lighting, Cameras & Rendering Engines', topics: ['3D Lighting Setups Eevee and Cycles', 'Camera Settings Focal Length Depth of Field', 'Composition and Render Properties'], concepts: ['Three-Point Lighting Setup', 'Cycles Raytracer vs Eevee Realtime Renderer', 'Render Passes and Denoising'], practice: ['Set up product lighting render scene', 'Configure camera depth-of-field focus on cup', 'Render final image export at 1080p'] },
      { goal: 'Rigging and Keyframe Animation Basics', topics: ['3D Rigging Armatures for Beginners', 'Keyframes and Interpolation Graph Editor', 'Principles of Animation Squashing Stretching'], concepts: ['Bones, Joints, and Armatures', 'Linear vs Bezier Interpolation Curve', 'Pose Mode and Timeline markers'], practice: ['Animate a bouncing ball with squash/stretch', 'Create a simple rotating windmill animation', 'Rig a basic robotic arm with two joints'] },
      { goal: 'Rigid Body Physics & Simulation Effects', topics: ['Blender Rigid Body Physics Simulation', 'Particle Systems Basics Hair and Emitters', 'Cloth and Fluid Physics Simulation'], concepts: ['Passive vs Active Rigid Bodies', 'Emitter settings (lifetime, velocity, gravity)', 'Collision boundaries'], practice: ['Animate a bowling ball smashing pins', 'Create a fireplace fire simulation using particles', 'Drape a realistic cloth tablecloth over the table'] },
      { goal: 'Sculpting, Retopology & Character Modeling', topics: ['Blender Sculpt Mode tutorial', 'Retopology best practices for low-poly', 'Dyntopo and Remesher tools'], concepts: ['DynTopo (Dynamic Topology)', 'Quad meshes vs Triangle meshes', 'Brushes (Grab, Draw, Crease, Inflate)'], practice: ['Sculpt a realistic cartoon face mesh', 'Retopologize the sculpt to clean quads', 'Bake high-res details onto low-poly normal maps'] },
      { goal: 'Advanced Character Rigging & Kinematics', topics: ['Inverse Kinematics IK rigging armature', 'Weight Painting skinning tutorial', 'Shape Keys and Driver controllers'], concepts: ['IK vs FK (Forward Kinematics)', 'Deformation envelopes and vertex weights', 'Facial shape keys for expressions'], practice: ['Rig a humanoid character structure with IK', 'Weight paint the shoulders and legs for clean bend', 'Create shape keys for blink and smile expressions'] },
      { goal: 'Production Pipeline - Compositing & Final Animation', topics: ['Blender Compositing Nodes Tutorial', 'Render Animation Video settings', 'Camera Tracking and VFX integration'], concepts: ['Render Layers and Color Grading', 'Video Codecs (H.264, FFmpeg)', 'Scene Compositing'], practice: ['Color grade your render using compositor nodes', 'Render complete 5-second animated clip', 'Export final MP4 portfolio reel video'] }
    ],
    'Cybersecurity': [
      { goal: 'Networking Basics & Linux System commands', topics: ['TCP IP Protocol DNS OSI Model Tutorial', 'Linux Command Line Basics for Hackers', 'Network Subnets IP routing configuration'], concepts: ['OSI 7 Layers structure', 'Bash scripting and File permissions', 'IP Addresses, Subnets, and Gateways'], practice: ['Configure static IP address in Linux terminal', 'Write bash script to ping local subnet range', 'Examine network traffic ports using netstat'] },
      { goal: 'Reconnaissance, Port Scanning & OWASP Top 10', topics: ['Nmap Port Scanning tutorial', 'OWASP Top 10 Vulnerabilities explained', 'Information gathering OSINT basics'], concepts: ['TCP Handshake scans vs UDP scans', 'SQL Injection, XSS, and CSRF', 'Subdomain enumeration & WHOIS lookup'], practice: ['Scan local target device using Nmap', 'Test local login form for SQL injection vulnerability', 'Perform OSINT audit on domain name'] },
      { goal: 'Vulnerability Scanning & Metasploit Framework', topics: ['Nessus Vulnerability Scanner tutorial', 'Metasploit Framework basic guide', 'Exploit Database search exploit usage'], concepts: ['CVE identifiers and Severity scoring', 'Payloads, Exploits, and Auxiliaries', 'Reverse Shells vs Bind Shells'], practice: ['Run Nessus vulnerability scan on local VM', 'Execute a basic exploit module in Metasploit console', 'Capture reverse shell connection on listening handler'] },
      { goal: 'Cryptography Basics & Password Cracking', topics: ['Cryptography Symetric Asymetric encryption', 'Hash Algorithms SHA MD5 bcrypt', 'John the Ripper Hashcat tutorial'], concepts: ['Public Key Infrastructure PKI', 'Salting hashes, Rainbow tables', 'Dictionary attacks vs Brute force'], practice: ['Encrypt text messages using GnuPG keys', 'Generate and crack MD5 password hashes locally', 'Perform dictionary crack attack using John the Ripper'] },
      { goal: 'Active Directory exploitation & Privilege Escalation', topics: ['Active Directory hacking basics Bloodhound', 'Linux Privilege Escalation techniques', 'Windows Privilege Escalation basic guide'], concepts: ['Kerberoasting and Pass-the-Hash', 'SUID permissions and Sudo exploits', 'Unquoted service paths, Registry access'], practice: ['Enumerate Local SUID files on Linux target', 'Bypass restricted access shell environment', 'Extract credentials from memory dumps'] },
      { goal: 'Wireless Security & Social Engineering', topics: ['WPA2 WPA3 wireless hacking wifite', 'Social Engineering Toolkit SET tutorial', 'Phishing simulation best practices'], concepts: ['Handshake capture and Deauth attacks', 'Credential harvesting', 'Email spoofing headers'], practice: ['Capture WPA2 handshake offline scan logs', 'Configure credential harvester page locally', 'Analyze headers of phishing email examples'] },
      { goal: 'Incident Response & Traffic Analysis', topics: ['Wireshark Network Traffic Analysis', 'Linux Log Analysis grep fail2ban', 'Digital Forensics basics Autopsy'], concepts: ['PCAP packet structures', 'Syslog, Auth.log patterns', 'Corrupted file systems carving'], practice: ['Filter PCAP capture for HTTP passwords', 'Write regex filters to parse authentication logs', 'Examine deleted file records from disk image'] },
      { goal: 'Capstone: Systems Hardening & Security Audit', topics: ['Firewall configuration UFW iptables', 'System Auditing CIS Benchmarks Lynis', 'Penetration Testing Report writing'], concepts: ['Defense in Depth', 'Port blocking and SSH hardening', 'Remediation guidelines'], practice: ['Harden a Linux server, close open ports', 'Run Lynis security audit scan reports', 'Compile formal penetration testing executive summary'] }
    ],
    'DevOps': [
      { goal: 'Linux Administration & Bash Scripting', topics: ['Linux System Administration tutorial', 'Advanced Bash Scripting with variables arrays', 'Linux services systemd systemctl'], concepts: ['Process management, memory usage logs', 'Conditionals, loops, and exits in Bash', 'Systemd unit configuration files'], practice: ['Create custom Systemd service log manager', 'Write Bash backup script running on cron schedule', 'Configure user roles, groups, and SSH keys'] },
      { goal: 'Git Workflows, Pipelines & CI/CD Core', topics: ['Git Branching strategies GitFlow Gitlab', 'GitHub Actions CI CD pipelines tutorial', 'Automated Testing integrations pipeline'], concepts: ['Merge requests, rebase, resolve conflicts', 'Actions runners, YAML workflows, secrets', 'Build pipelines'], practice: ['Resolve complex git merge conflict in terminal', 'Create GitHub Actions workflow building Node app', 'Implement automated linting checks on commit push'] },
      { goal: 'Docker Containerization & Image Registry', topics: ['Docker Containers tutorial deep dive', 'Writing efficient multi stage Dockerfile', 'Docker Compose multi container apps'], concepts: ['Images vs Containers, layer caching', 'Alpine images, environment variables', 'Bridges, networks, and persistent volumes'], practice: ['Build multi-stage node web application image', 'Compose a React, Express, and Redis stack', 'Push built image to Docker Hub repository'] },
      { goal: 'Kubernetes Orchestration & Core Workloads', topics: ['Kubernetes Crash Course for Beginners', 'K8s Pods Deployments Services YAML', 'Kubernetes Architecture Control Plane Nodes'], concepts: ['Declartive vs Imperative commands', 'ClusterIP, NodePort, LoadBalancer', 'ReplicaSets and Rollouts'], practice: ['Deploy local Kubernetes cluster using Minikube', 'Write deployment YAML for container webapp', 'Expose deployment via Service, perform rollout update'] },
      { goal: 'Infrastructure as Code (IaC) & Configuration', topics: ['Terraform Infrastructure as Code tutorial', 'Ansible Playbooks Automation config', 'Terraform State management workspace'], concepts: ['Providers, Resources, Plan, Apply', 'Idempotency, Inventories, Tasks', 'State locks, Remote backends'], practice: ['Provision local Docker container using Terraform', 'Write Ansible playbook configuring Nginx server', 'Define input variables output values in Terraform configuration'] },
      { goal: 'Cloud Infrastructure & IAM Security', topics: ['AWS Cloud Practitioner core services', 'Cloud Compute storage VPC network', 'Identity Access Management IAM policy'], concepts: ['EC2, S3, RDS, Lambda', 'Subnets, route tables, security groups', 'Least privilege permission policies'], practice: ['Deploy static website bucket to S3 storage', 'Configure security groups for AWS database instance', 'Create restricted IAM policy for developer roles'] },
      { goal: 'Cluster Monitoring & Log Aggregation', topics: ['Prometheus Grafana Metrics monitoring', 'EFK stack Elasticsearch Fluentd Kibana', 'Kubernetes Helm package manager'], concepts: ['Time series database queries PromQL', 'Log scraping, index configurations', 'Helm Charts, Releases, Custom values'], practice: ['Install Prometheus/Grafana stack in cluster', 'Create Grafana dashboard monitoring CPU/Memory usage', 'Deploy service using custom values in Helm Chart'] },
      { goal: 'Capstone DevOps Architecture deployment', topics: ['Production Ready DevOps architecture', 'SSL TLS configuration Certbot Ingress', 'DevSecOps vulnerability scans docker'], concepts: ['Ingress Controller routing rules', 'Automatic certificate renewal cron jobs', 'Static Application Security Testing SAST'], practice: ['Configure Nginx Ingress Controller SSL routes', 'Docker scan image for dependency CVE vulnerabilities', 'Launch full-stack application pipeline to cloud cluster'] }
    ]
  };

  // Select appropriate base curriculum or dynamically build one if not matched
  let baseCurriculum = curricula[interest];
  if (!baseCurriculum) {
    // Check for loose match first (case-insensitive)
    const matchKey = Object.keys(curricula).find(k => k.toLowerCase() === interest.toLowerCase());
    if (matchKey) {
      baseCurriculum = curricula[matchKey];
    } else {
      // Run smart keyword routing to select the best template domain
      const interestLower = interest.toLowerCase();
      
      if (
        interestLower.includes('blend') || 
        interestLower.includes('animat') || 
        interestLower.includes('3d') || 
        interestLower.includes('game') || 
        interestLower.includes('unity') || 
        interestLower.includes('unreal') || 
        interestLower.includes('render') || 
        interestLower.includes('model') || 
        interestLower.includes('maya') ||
        interestLower.includes('graphic') ||
        interestLower.includes('creative')
      ) {
        baseCurriculum = curricula['Creative3D'];
      } else if (
        interestLower.includes('cyber') || 
        interestLower.includes('security') || 
        interestLower.includes('hack') || 
        interestLower.includes('pen') || 
        interestLower.includes('network') || 
        interestLower.includes('crypto')
      ) {
        baseCurriculum = curricula['Cybersecurity'];
      } else if (
        interestLower.includes('devops') || 
        interestLower.includes('dock') || 
        interestLower.includes('kuber') || 
        interestLower.includes('cloud') || 
        interestLower.includes('aws') || 
        interestLower.includes('azure') || 
        interestLower.includes('pipeline') || 
        interestLower.includes('ci/cd')
      ) {
        baseCurriculum = curricula['DevOps'];
      } else if (
        interestLower.includes('web') || 
        interestLower.includes('react') || 
        interestLower.includes('next') || 
        interestLower.includes('js') || 
        interestLower.includes('frontend') || 
        interestLower.includes('backend') || 
        interestLower.includes('fullstack')
      ) {
        baseCurriculum = curricula['Web Development'];
      } else if (
        interestLower.includes('data') || 
        interestLower.includes('ai') || 
        interestLower.includes('ml') || 
        interestLower.includes('machine') || 
        interestLower.includes('learn') || 
        interestLower.includes('python')
      ) {
        baseCurriculum = curricula['AI'];
      } else if (
        interestLower.includes('git') ||
        interestLower.includes('dsa') ||
        interestLower.includes('algo') ||
        interestLower.includes('struct') ||
        interestLower.includes('program') ||
        interestLower.includes('code') ||
        interestLower.includes('develop') ||
        interestLower.includes('engineer') ||
        interestLower.includes('architect') ||
        interestLower.includes('pattern') ||
        interestLower.includes('solid') ||
        interestLower.includes('oop') ||
        interestLower.includes('test') ||
        interestLower.includes('qa') ||
        interestLower.includes('jest') ||
        interestLower.includes('java') ||
        interestLower.includes('c#') ||
        interestLower.includes('c++') ||
        interestLower.includes('rust') ||
        interestLower.includes('golang') ||
        interestLower.includes('swift') ||
        interestLower.includes('kotlin')
      ) {
        baseCurriculum = curricula['Software Engineering'];
      } else {
        // Dynamically build a custom creative / study curriculum for ANY topic (e.g. French Cooking, Gardening, Guitar)
        baseCurriculum = [
          { 
            goal: `Foundations of ${interest}`, 
            topics: [`${interest} Basics for Beginners`, `Introduction to ${interest}`, `Core Tools and Setup for ${interest}`], 
            concepts: [`Fundamental principles of ${interest}`, `Understanding the core layout`, `Essential safety & setups`], 
            practice: [`Perform basic setup tasks for ${interest}`, `Complete your first introductory exercise in ${interest}`], 
            mini_project: `Basic ${interest} practical configuration setup` 
          },
          { 
            goal: `Core Skills and Early Practice in ${interest}`, 
            topics: [`Essential techniques in ${interest}`, `${interest} intermediate practices`, `Avoiding common mistakes in ${interest}`], 
            concepts: [`Core workflow optimizations`, `Material and style properties`, `Quality standard rules`], 
            practice: [`Execute standard operations in ${interest}`, `Create a small draft study piece`], 
            mini_project: `First complete modular project in ${interest}` 
          },
          { 
            goal: `Intermediate Application & Styling in ${interest}`, 
            topics: [`Advanced techniques in ${interest}`, `Structuring larger plans for ${interest}`, `Adding style and details in ${interest}`], 
            concepts: [`Detail control and execution`, `Workflow efficiency`, `Refinement methods`], 
            practice: [`Build a complete intermediate project`, `Optimize your workflow for speed`], 
            mini_project: `Intermediate portfolio piece for ${interest}` 
          },
          { 
            goal: `Advanced Customization & Professional Work in ${interest}`, 
            topics: [`Expert tips for ${interest}`, `Production level execution in ${interest}`, `Professional presentation of ${interest}`], 
            concepts: [`High fidelity execution`, `Troubleshooting and corrections`, `Quality assurance audits`], 
            practice: [`Run a diagnostic review on your work`, `Apply advanced details to your project`], 
            mini_project: `High fidelity standalone project for ${interest}` 
          },
          { 
            goal: `Integration and Final Portfolio Presentation`, 
            topics: [`Publishing and presenting your ${interest}`, `Final reviews and edits for ${interest}`, `Preparing portfolio deliverables`], 
            concepts: [`Portfolio presentation standards`, `Packaging and sharing details`, `Next developmental steps`], 
            practice: [`Compile all study reports and records`, `Perform final polishing sweeps`], 
            mini_project: `Complete Capstone Project: Production-ready presentation showcasing your ${interest} skills` 
          }
        ];
      }
    }
  }
  
  // Slice or adjust weeks to match requested deadline
  const finalWeeks = [];
  for (let w = 1; w <= totalWeeks; w++) {
    // If roadmap is longer than the template curriculum, cycle/duplicate and adjust names
    const templateIndex = (w - 1) % baseCurriculum.length;
    const template = baseCurriculum[templateIndex];
    
    // Add custom adjustments based on levels
    let weekGoal = template.goal;
    let weekTopics = [...template.topics];
    let weekConcepts = [...template.concepts];
    let weekPractice = [...template.practice];
    let weekProject = template.mini_project;

    if (level === 'Beginner') {
      weekGoal = 'Introduction to ' + weekGoal;
      weekTopics = weekTopics.map(t => t + ' beginner tutorial');
      weekPractice.push('Write comprehensive notes about concepts');
    } else if (level === 'Advanced') {
      weekGoal = 'Advanced ' + weekGoal;
      weekTopics = weekTopics.map(t => 'Advanced ' + t + ' mastery');
      weekConcepts = weekConcepts.map(c => 'Deep dive ' + c + ' internals');
      weekPractice = weekPractice.map(p => 'Optimize & secure ' + p);
    }

    finalWeeks.push({
      week: w,
      goal: weekGoal,
      topics: weekTopics,
      concepts: weekConcepts,
      practice: weekPractice,
      mini_project: w === totalWeeks ? `Final Capstone: Production-ready ${interest} System - Build, test, containerize, and deploy a comprehensive system matching your interests.` : `${weekProject || 'Weekly Mini-Project'} - Code and build a standalone project implementing this week's topics.`,
      estimated_hours: weeklyHours
    });
  }

  return {
    summary: `This is a highly customized ${level} roadmap for ${interest}. Over the next ${totalWeeks} weeks, you will build foundational knowledge, complete ${totalWeeks - 1} micro-projects, and culminate with a full production capstone. Study for ${dailyHours} hours daily to stay on track!`,
    roadmap: finalWeeks
  };
}

function generateMockChatResponse(userMessage, context) {
  const msg = userMessage.toLowerCase();
  const name = context.userProfile?.name || 'Student';
  const interest = context.userProfile?.onboardingData?.interest || 'General Development';
  const level = context.userProfile?.onboardingData?.level || 'Beginner';
  const currentWeek = context.currentWeek || 1;
  const currentWeekData = context.roadmap?.roadmap?.find(w => w.week === currentWeek);

  // 1. Greet messages
  if (msg.includes('hello') || msg.includes('hi ') || msg.includes('hey') || msg.includes('greet')) {
    return `Hello ${name}! 👋 I am your PathPilot AI doubts assistant. I see you are mastering **${interest}** at a **${level}** level. 
    
Currently, you are on **Week ${currentWeek}**. How can I help you clear your concepts today?`;
  }

  // 2. Next task / Study action
  if (msg.includes('next') || msg.includes('todo') || msg.includes('what should i do') || msg.includes('suggest my next study task')) {
    if (!currentWeekData) {
      return `Let's keep learning! Check out your Planner tab to see what study tasks are set up for today.`;
    }
    return `### 🚀 Recommended Next Step for Week ${currentWeek}
    
Based on your timeline for **${interest}**, your target this week is: **${currentWeekData.goal}**.

Here is what you should focus on next:
1. **Study**: Learn about *${currentWeekData.topics[0]}*. Double-click on it in your roadmap to fetch the best YouTube courses.
2. **Practice**: Attempt this task: *${currentWeekData.practice[0]}*.
3. **Weekly Goal**: Work towards your project: *${currentWeekData.mini_project}*.

Let me know if you need code templates or concept explanations for any of these!`;
  }

  // 3. Explain this week's concepts
  if (msg.includes('explain this week') || (msg.includes('concept') && (msg.includes('this week') || msg.includes('current') || msg.includes('active') || msg.includes('explain')))) {
    if (currentWeekData && currentWeekData.concepts && currentWeekData.concepts.length > 0) {
      const conceptsListStr = currentWeekData.concepts.map((c, i) => `- **${c}**`).join('\n');
      return `### 💡 Week ${currentWeek} Conceptual Guide

Here are the key technical concepts you need to master for **Week ${currentWeek}**:

${conceptsListStr}

Which of these would you like me to explain with a code example? Simply type *"Explain [concept]"*.`;
    } else {
      return `Your active week focuses on setting up your environment and writing your first hello-world apps. Let me know what specific topic you are currently stuck on!`;
    }
  }

  // 4. Debugging code
  if (msg.includes('debug') || msg.includes('error') || msg.includes('bug') || msg.includes('solve some code')) {
    return `### 💻 AI Debugging Assistant

I can help you debug your code! Please paste your error trace or code block. 

To help you get started immediately, here is a quick debugging checklist:
1. **Check for Syntax Errors**: Look for missing commas, unclosed brackets \`}\`, or mismatched parentheses \`()\`.
2. **Examine Variable Scopes**: Make sure the variables you are accessing are defined in the correct scope.
3. **Use Logs**: Insert \`console.log()\` (JavaScript/React) or \`print()\` (Python) before the line where the code breaks to check the values of variables.
4. **Read Error Messages**: The error message usually specifies the file and line number (e.g. *Cannot read properties of undefined*).

Paste your snippet below, and I'll highlight the bugs!`;
  }

  // 5. Explain variables and state
  if (msg.includes('variables and state') || (msg.includes('variable') && msg.includes('state'))) {
    return `### 📦 Variables vs State (React/JavaScript)

Here is a clear breakdown of **Variables** vs **State**:

1. **Variables (\`let\`, \`const\`)**:
   - Variables store temporary data.
   - **Crucial**: Modifying a standard variable **does not** trigger React to re-render the UI.
   - Use variables for static configuration or calculations within a single render cycle.
   \`\`\`javascript
   // UI will NOT update if count changes:
   let count = 0;
   function handleClick() {
     count += 1;
   }
   \`\`\`

2. **State (\`useState\`)**:
   - State is a special variable managed by React that persists between renders.
   - **Crucial**: Changing state **automatically triggers a re-render**, updating the UI with the new values.
   - Use state for dynamic inputs, fetched API results, or active user choices.
   \`\`\`javascript
   // UI WILL update dynamically:
   const [count, setCount] = React.useState(0);
   function handleClick() {
     setCount(count + 1);
   }
   \`\`\`

Would you like a demo on how to handle objects/arrays in React state?`;
  }

  // 6. Common topics lookup (Big O, Linked List, React Hooks, Recursion, Docker)
  if (msg.includes('big o') || msg.includes('complexity') || msg.includes('time complexity')) {
    return `### ⏱️ Understanding Big O Notation

**Big O Notation** describes the efficiency of an algorithm as the input size ($N$) grows, looking at the worst-case scenario.

Common Time Complexities:
- **$O(1)$ - Constant Time**: Running time is independent of input size (e.g. accessing array item by index).
- **$O(\log N)$ - Logarithmic Time**: Input size is halved at each step (e.g. Binary Search).
- **$O(N)$ - Linear Time**: Takes steps proportional to input size (e.g. single loop through array).
- **$O(N \log N)$ - Linearithmic Time**: (e.g. Merge Sort, Quick Sort).
- **$O(N^2)$ - Quadratic Time**: Nested loops (e.g. Bubble Sort).

*Tips for ${level}s*: Always try to avoid nested loops ($O(N^2)$) by using hash maps or sorting first to achieve $O(N)$ or $O(N \log N)$ time.`;
  }

  if (msg.includes('linked list')) {
    return `### 🔗 Linked Lists Explained

A **Linked List** is a linear data structure where elements (called **Nodes**) are not stored in contiguous memory locations. Instead, each node points to the next node.

Structure:
- **Node**: Contains \`data\` and a reference (\`next\`) to the next node.
- **Head**: The first node of the list.
- **Tail**: The last node (points to \`null\`).

Comparison with Arrays:
- **Insertion/Deletion**: Very fast ($O(1)$) because you only update pointers.
- **Accessing Elements**: Slow ($O(N)$) because you must traverse from Head node by node.

Code Example (JavaScript):
\`\`\`javascript
class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}
// Linked List Chain
const first = new Node("A");
const second = new Node("B");
first.next = second; // Linked!
\`\`\`
`;
  }

  if (msg.includes('recursion') || msg.includes('recursive')) {
    return `### 🔄 Recursion Guide

**Recursion** is a programming technique where a function calls itself to solve smaller instances of the same problem.

Two essential components of a recursive function:
1. **Base Case**: The condition under which the function stops calling itself. Without this, you get a **Stack Overflow** error!
2. **Recursive Step**: The logic where the function calls itself with modified parameters that move closer to the base case.

Classic Example (Factorial):
\`\`\`javascript
function factorial(n) {
  // 1. Base Case
  if (n <= 1) return 1;
  
  // 2. Recursive Step
  return n * factorial(n - 1);
}
console.log(factorial(5)); // Output: 120
\`\`\`
`;
  }

  if (msg.includes('react hook') || msg.includes('usestate') || msg.includes('useeffect')) {
    return `### 🎣 React Hooks Core: useState & useEffect

Hooks let you use state and lifecycle features in functional React components.

1. **\`useState\`**: Adds local state to a component.
\`\`\`jsx
const [name, setName] = useState('Guest');
\`\`\`

2. **\`useEffect\`**: Performs side effects (data fetching, DOM updates, event listeners).
\`\`\`jsx
useEffect(() => {
  console.log("Component mounted or state updated!");
  // Cleanup return function (optional)
  return () => console.log("Component unmounting");
}, [dependencies]); // Triggers when values in array change. Empty array [] runs once on mount.
\`\`\`
`;
  }

  if (msg.includes('docker') || msg.includes('container')) {
    return `### 🐳 Introduction to Docker

**Docker** is a tool designed to make it easier to create, deploy, and run applications by using **Containers**.

Key Terms:
- **Dockerfile**: A script containing instructions to build a Docker Image.
- **Image**: A read-only template with instructions for creating a Docker Container. Think of it like a blueprint.
- **Container**: A runnable instance of an image. It is isolated and contains everything needed to run your code (OS, runtime, system tools, libraries).

Simple Dockerfile Example:
\`\`\`dockerfile
# Start from Node base image
FROM node:18-alpine
# Set work directory
WORKDIR /app
# Copy package file
COPY package*.json ./
# Install modules
RUN npm install
# Copy code
COPY . .
# Run application
CMD ["npm", "start"]
\`\`\`
`;
  }

  // 7. General concept extraction fallback
  if (msg.includes('explain') || msg.includes('what is') || msg.includes('how does')) {
    const query = userMessage.replace(/explain|what is|how does/gi, '').trim();
    return `### 📖 Conceptual Explanation: ${query}

Here is a summary explanation of **${query}** for **${level}** level in the context of **${interest}**:

1. **The Core Concept**: This serves as a structural utility or architectural concept to handle state/logic blocks securely.
2. **Real World Analogy**: Think of it like a vending machine. You press a selection (parameter input), it validates the credit (condition logic), and dispenses the item (return output).
3. **Quick Code Blueprint**:
\`\`\`javascript
// Demonstration blueprint
function runDemo() {
  console.log("Learning ${query} in ${interest}!");
}
runDemo();
\`\`\`

Would you like me to provide a specific React or Python example for this?`;
  }

  // 8. General fallback
  return `I am analyzing your **${interest}** roadmap progress, ${name}! 🚀

We are currently on **Week ${currentWeek}**. Keep working through your slots today to earn XP and level up.

How can I help you clear your doubts? Try asking me:
- *"Explain this week's concepts"*
- *"Explain variables and state"*
- *"Help me debug some code"*
- *"Suggest my next study task"*`;
}

// ============================================================
// QUIZ GENERATOR
// ============================================================

exports.generateQuiz = async (weekData, interest, level, userApiKey = null) => {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  const topics   = weekData?.topics   || [];
  const concepts = weekData?.concepts || [];
  const practice = weekData?.practice || [];
  const goal     = weekData?.goal     || `${interest} basics`;
  const week     = weekData?.week     || 1;

  const prompt = `You are PathPilot AI. Generate exactly 10 quiz questions for a ${level} student studying ${interest}.
Week ${week} goal: "${goal}"
Topics: ${topics.join(', ')}
Concepts: ${concepts.join(', ')}
Practice tasks: ${practice.join(', ')}
Distribution: 3 Easy, 5 Medium, 2 Hard.
Types: MCQ (4 options), True/False, Scenario.
Return ONLY raw JSON: {"quiz":[{"question":"","options":[],"answer":"","difficulty":"Easy|Medium|Hard","type":"MCQ|True/False|Scenario","explanation":""}]}`;

  if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        { model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Output ONLY raw JSON.' }, { role: 'user', content: prompt }], temperature: 0.7, response_format: { type: 'json_object' } },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, timeout: 20000 }
      );
      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) { console.error('OpenAI quiz failed, using fallback:', err.message); }
  }
  return generateMockQuiz(weekData, interest, level);
};

// ============================================================
// NOTES GENERATOR
// ============================================================

exports.generateNotes = async (topics, concepts, interest, level, userApiKey = null) => {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  const prompt = `You are PathPilot AI notes generator. Generate concise study notes for a ${level} student studying ${interest}.
Topics: ${topics.join(', ')}
Concepts: ${concepts.join(', ')}
Return ONLY raw JSON: {"notes":[{"topic":"","summary":"","key_points":[],"important_terms":[],"examples":[]}]}
Rules: short sentences, easy language, interview-useful.`;

  if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        { model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Output ONLY raw JSON.' }, { role: 'user', content: prompt }], temperature: 0.6, response_format: { type: 'json_object' } },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, timeout: 20000 }
      );
      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) { console.error('OpenAI notes failed, using fallback:', err.message); }
  }
  return generateMockNotes(topics, concepts, interest, level);
};

// ============================================================
// FLASHCARD GENERATOR
// ============================================================

exports.generateFlashcards = async (topics, concepts, interest, level, userApiKey = null) => {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  const prompt = `You are PathPilot AI flashcard generator. Generate up to 20 active-recall flashcards for a ${level} student studying ${interest}.
Topics: ${topics.join(', ')}
Concepts: ${concepts.join(', ')}
Return ONLY raw JSON: {"flashcards":[{"front":"","back":"","difficulty":"Easy|Medium|Hard","category":""}]}
Rules: active recall, short answers (max 2 sentences), max 20 cards.`;

  if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        { model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Output ONLY raw JSON.' }, { role: 'user', content: prompt }], temperature: 0.6, response_format: { type: 'json_object' } },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, timeout: 20000 }
      );
      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) { console.error('OpenAI flashcards failed, using fallback:', err.message); }
  }
  return generateMockFlashcards(topics, concepts, interest, level);
};

// ============================================================
// DAILY PLAN GENERATOR  (pure local computation)
// ============================================================

exports.generateDailyPlan = (onboardingData, currentWeekData, completedTasks) => {
  const dailyHours  = parseFloat(onboardingData?.dailyHours || 2);
  const topics      = currentWeekData?.topics       || [];
  const practice    = currentWeekData?.practice     || [];
  const miniProject = currentWeekData?.mini_project || '';
  const interest    = onboardingData?.interest      || 'your subject';

  const doneTopicNames    = completedTasks.filter(t => t.taskType === 'topic').map(t => t.taskName);
  const donePracticeNames = completedTasks.filter(t => t.taskType === 'practice').map(t => t.taskName);

  const pendingTopics   = topics.filter(t => !doneTopicNames.includes(t));
  const pendingPractice = practice.filter(p => !donePracticeNames.includes(p));

  const slot1H = Math.max(0.5, parseFloat((dailyHours * 0.6).toFixed(1)));
  const slot2H = Math.max(0.5, parseFloat((dailyHours - slot1H).toFixed(1)));

  const sTopics   = pendingTopics.length   > 0 ? pendingTopics   : topics;
  const sPractice = pendingPractice.length > 0 ? pendingPractice : practice;

  const tasks = [];
  if (sTopics[0])   tasks.push({ task: sTopics[0],   type: 'Study',    duration: `${Math.round(slot1H * 60)} min`,       icon: '📖' });
  if (sTopics[1])   tasks.push({ task: sTopics[1],   type: 'Study',    duration: `${Math.round((slot1H / 2) * 60)} min`, icon: '📖' });
  if (sPractice[0]) tasks.push({ task: sPractice[0], type: 'Practice', duration: `${Math.round(slot2H * 60)} min`,       icon: '💻' });
  if (miniProject && !completedTasks.find(t => t.taskType === 'mini_project')) {
    tasks.push({ task: `Work on: ${miniProject.substring(0, 80)}`, type: 'Project', duration: '20 min', icon: '🚀' });
  }

  const breaks = [];
  if (dailyHours >= 1.5) breaks.push({ after: `${Math.round(slot1H * 60)} min of study`, duration: '10 minutes', type: 'Rest & hydrate' });
  if (dailyHours >= 3)   breaks.push({ after: `${Math.round(dailyHours * 60 * 0.75)} min total`, duration: '15 minutes', type: 'Long refresh break' });

  return {
    today_plan: {
      slot1:          sTopics[0]   || `Review ${interest} concepts`,
      slot2:          sPractice[0] || `Practice ${interest} exercises`,
      tasks,
      estimated_time: `${dailyHours} hour${dailyHours !== 1 ? 's' : ''}`,
      breaks
    }
  };
};

// ============================================================
// PROGRESS ANALYTICS  (local computation)
// ============================================================

exports.generateProgressAnalytics = (onboardingData, progress, roadmap) => {
  const totalWeeks     = roadmap?.roadmap?.length || 8;
  const completedTasks = progress?.completedTasks || [];
  const studyLogs      = progress?.studyLogs      || [];

  let totalTasks = 0;
  roadmap?.roadmap?.forEach(w => {
    totalTasks += (w.topics?.length || 0) + (w.practice?.length || 0) + (w.mini_project ? 1 : 0);
  });

  const completion = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const recentLogs = studyLogs.slice(-14);
  const totalHoursRecent = recentLogs.reduce((s, l) => s + (l.hours || 0), 0);
  const weeklyVelocity   = parseFloat((totalHoursRecent / Math.max(1, recentLogs.length / 7)).toFixed(1));

  const interest   = onboardingData?.interest    || 'your subject';
  const dailyGoal  = parseFloat(onboardingData?.dailyHours || 2);
  const remaining  = 100 - completion;
  const weeksLeft  = remaining > 0 ? Math.ceil((totalWeeks * remaining) / 100) : 0;
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + weeksLeft * 7);
  const predictedFinish = weeksLeft === 0
    ? 'Roadmap Completed! 🎉'
    : finishDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const currentWeekRoadmap = roadmap?.roadmap?.find(w => {
    const done  = completedTasks.filter(t => t.week === w.week).length;
    const total = (w.topics?.length || 0) + (w.practice?.length || 0) + (w.mini_project ? 1 : 0);
    return done < total;
  });
  const focusArea = currentWeekRoadmap?.goal || `${interest} core fundamentals`;

  const msgs = [
    `You're just getting started — every expert was once a beginner. Commit to ${dailyGoal} hrs today! 🚀`,
    `${completion}% complete! You've already built a solid foundation. Keep pushing through this week! 💪`,
    `Halfway there and gaining speed! Your consistency is building real expertise in ${interest}. ⚡`,
    `You're in the advanced zone — ${completion}% done. Polish your skills and push into the capstone. 🔥`,
    `Almost finished! You've mastered the fundamentals of ${interest}. Sprint to the finish! 🏆`
  ];

  return {
    analytics: {
      completion:            `${completion}%`,
      weekly_velocity:       `${weeklyVelocity} hrs/week`,
      predicted_finish_date: predictedFinish,
      focus_area:            focusArea,
      motivation_message:    msgs[Math.min(4, Math.floor(completion / 20))]
    }
  };
};

// ============================================================
// PRIVATE: Mock Quiz Generator
// ============================================================

function generateMockQuiz(weekData, interest, level) {
  const topics   = weekData?.topics   || [`Introduction to ${interest}`];
  const concepts = weekData?.concepts || [`Core principles of ${interest}`];
  const practice = weekData?.practice || [`Build a starter ${interest} project`];
  const goal     = weekData?.goal     || `${interest} fundamentals`;
  const week     = weekData?.week     || 1;

  const easy = [
    {
      question: `True or False: "${concepts[0]}" is a foundational concept in ${interest}.`,
      options: ['True', 'False'], answer: 'True', difficulty: 'Easy', type: 'True/False',
      explanation: `Correct! "${concepts[0]}" is a core building block of ${interest} used throughout your learning journey.`
    },
    {
      question: `Which best describes the purpose of "${topics[0]}" in ${interest}?`,
      options: [`It provides the core structure for building ${interest} solutions`, `It is an optional add-on with no impact`, `It only applies to enterprise-level projects`, `It was replaced and is no longer relevant`],
      answer: `It provides the core structure for building ${interest} solutions`, difficulty: 'Easy', type: 'MCQ',
      explanation: `"${topics[0]}" is central to ${interest}. Understanding it is essential for any real project in this domain.`
    },
    {
      question: `True or False: The best way to learn "${topics[0]}" is through tutorials AND hands-on projects.`,
      options: ['True', 'False'], answer: 'True', difficulty: 'Easy', type: 'True/False',
      explanation: `True — passive watching alone is insufficient. Building projects while studying dramatically accelerates skill.`
    }
  ];

  const medium = [
    {
      question: `How does "${concepts[0]}" relate to "${concepts[1] || 'practical implementation'}" in ${interest}?`,
      options: [`"${concepts[0]}" defines the core logic; "${concepts[1] || 'practical implementation'}" applies it in projects`, `They are identical`, `"${concepts[0]}" is deprecated`, `"${concepts[1] || 'practical implementation'}" is only in paid frameworks`],
      answer: `"${concepts[0]}" defines the core logic; "${concepts[1] || 'practical implementation'}" applies it in projects`, difficulty: 'Medium', type: 'MCQ',
      explanation: `These concepts serve complementary roles. Understanding how they interact is key to good ${interest} architecture.`
    },
    {
      question: `Scenario: You are working on Week ${week}'s goal — "${goal}" — and your first implementation fails. What is the most effective approach?`,
      options: [`Add logs to isolate the issue, check documentation, and write a minimal reproducible example`, `Restart the entire project immediately`, `Copy a working solution online without understanding it`, `Skip this topic and move to next week`],
      answer: `Add logs to isolate the issue, check documentation, and write a minimal reproducible example`, difficulty: 'Medium', type: 'Scenario',
      explanation: `Systematic debugging — isolate → document → reproduce — is the industry-standard approach. Never skip foundations.`
    },
    {
      question: `Which practice task best reinforces "${topics[0]}"?`,
      options: [practice[0] || `Build a project implementing ${topics[0]} from scratch`, `Read Wikipedia three times`, `Watch a 2-hour video without coding`, `Memorise syntax without understanding logic`],
      answer: practice[0] || `Build a project implementing ${topics[0]} from scratch`, difficulty: 'Medium', type: 'MCQ',
      explanation: `Hands-on project work is the most effective way to solidify concepts. Passive learning leads to shallow understanding.`
    },
    {
      question: `True or False: Understanding "${concepts[concepts.length - 1] || concepts[0]}" is necessary before moving to advanced ${interest} topics.`,
      options: ['True', 'False'], answer: 'True', difficulty: 'Medium', type: 'True/False',
      explanation: `Correct — skipping foundational concepts creates knowledge gaps that compound as complexity grows.`
    },
    {
      question: `Scenario: You completed "${topics[0]}" but are struggling with "${topics[1] || topics[0]}". What is your best next step?`,
      options: [`Review notes on "${topics[0]}", identify the conceptual link, and build a small bridging exercise`, `Mark complete and move forward without resolving the confusion`, `Switch to a different subject`, `Ask someone else to complete the task`],
      answer: `Review notes on "${topics[0]}", identify the conceptual link, and build a small bridging exercise`, difficulty: 'Medium', type: 'Scenario',
      explanation: `Bridging exercises that connect known and unknown concepts are the most effective way to overcome learning plateaus.`
    }
  ];

  const hard = [
    {
      question: `Advanced: "${practice[practice.length - 1] || topics[0]}" works locally but fails in production. Which approach resolves this?`,
      options: [`Compare env configs, check missing env variables, review dependency versions, add logging, and test with production-like data locally`, `Redeploy multiple times hoping it resolves`, `Rewrite in a different language`, `Disable error handling so the app does not crash visibly`],
      answer: `Compare env configs, check missing env variables, review dependency versions, add logging, and test with production-like data locally`, difficulty: 'Hard', type: 'Scenario',
      explanation: `Production bugs are usually caused by environment differences. Systematic env comparison is always the first step.`
    },
    {
      question: `Architecture: For a production ${interest} project at Week ${week}, which approach is most scalable?`,
      options: [`Modular architecture with separation of concerns, error handling, unit tests, and version control`, `Write all logic in a single file for simplicity`, `Avoid version control to keep it lightweight`, `Deploy without testing because manual testing is faster`],
      answer: `Modular architecture with separation of concerns, error handling, unit tests, and version control`, difficulty: 'Hard', type: 'MCQ',
      explanation: `Production systems require modular design, testing, error handling, and version control. Shortcuts create technical debt.`
    }
  ];

  return { quiz: [...easy, ...medium, ...hard] };
}

// ============================================================
// PRIVATE: Mock Notes Generator
// ============================================================

function generateMockNotes(topics, concepts, interest, level) {
  if (!topics || topics.length === 0) {
    topics = [`${interest} Fundamentals`, `Core ${interest} Concepts`, `${interest} Best Practices`];
  }
  return {
    notes: topics.slice(0, 5).map((topic, idx) => {
      const rc = concepts[idx] || concepts[0] || `${interest} core logic`;
      return {
        topic,
        summary: `${topic} is a key component of ${interest} at the ${level} level. Mastering this topic helps you build structured, efficient solutions and prepares you for real-world ${interest} development.`,
        key_points: [
          `${topic} is used to solve ${interest} problems by applying ${rc}`,
          `At the ${level} level, focus on understanding the "why" behind ${topic}, not just the syntax`,
          `Common use cases: building features, debugging issues, and optimising performance`,
          `Always practice ${topic} by writing code from scratch rather than copying examples`,
          `${rc} and ${topic} work together — understanding one reinforces the other`
        ],
        important_terms: [rc, `${topic} lifecycle`, `${interest} best practices`, `Error handling in ${topic}`, `Performance optimisation`],
        examples: [
          `Example 1: Apply "${topic}" — create a small ${interest} demo implementing this concept end-to-end`,
          `Example 2: Debug a common "${topic}" mistake — introduce a bug intentionally and practice fixing it`,
          `Example 3: Refactor a working "${topic}" implementation following ${interest} clean code principles`
        ]
      };
    })
  };
}

// ============================================================
// PRIVATE: Mock Flashcard Generator
// ============================================================

function generateMockFlashcards(topics, concepts, interest, level) {
  const cards = [];

  concepts.slice(0, 8).forEach((concept, idx) => {
    cards.push({
      front: `What is "${concept}" in ${interest}?`,
      back: `${concept} is a core building block of ${interest} that ${level === 'Beginner' ? 'beginners use to' : 'developers apply to'} structure solutions. It connects directly to ${topics[idx] || topics[0] || interest} workflows.`,
      difficulty: idx < 3 ? 'Easy' : idx < 6 ? 'Medium' : 'Hard',
      category: interest
    });
  });

  topics.slice(0, 6).forEach(topic => {
    cards.push({
      front: `How do you apply "${topic}" effectively as a ${level}?`,
      back: `1. Understand the concept (docs/tutorial)\n2. Build a minimal working example\n3. Add error handling\n4. Integrate into your weekly project\n5. Review and refactor`,
      difficulty: 'Medium',
      category: interest
    });
  });

  cards.push({ front: `What is Active Recall?`, back: `Testing yourself on material WITHOUT looking at notes. Forces active retrieval — boosts retention by up to 50% vs passive re-reading.`, difficulty: 'Easy', category: 'Study Skills' });
  cards.push({ front: `What is the Feynman Technique?`, back: `Explain a concept in simple terms as if teaching a child. If you can't explain it simply, you don't understand it deeply enough yet.`, difficulty: 'Easy', category: 'Study Skills' });
  cards.push({ front: `What is Spaced Repetition?`, back: `Reviewing material at increasing intervals (Day 1 → Day 3 → Day 7 → Day 14). Exploits the spacing effect to move knowledge into long-term memory.`, difficulty: 'Easy', category: 'Study Skills' });
  cards.push({ front: `What is the most important habit for mastering ${interest}?`, back: `Daily consistent practice — even 30 min/day outperforms 8-hour weekend sessions. Consistency builds the neural pathways that make ${interest} feel natural.`, difficulty: 'Easy', category: 'Study Skills' });

  return { flashcards: cards.slice(0, 20) };
}

// ============================================================
// PROJECT IDEAS & CHALLENGES GENERATOR
// ============================================================

exports.generateProjectIdeas = async (weekData, interest, level, userApiKey = null) => {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  const topics   = weekData?.topics   || [];
  const concepts = weekData?.concepts || [];
  const practice = weekData?.practice || [];
  const goal     = weekData?.goal     || `${interest} basics`;
  const week     = weekData?.week     || 1;

  const prompt = `You are PathPilot AI. Suggest exactly 3 weekly project ideas/challenges for a ${level} student studying ${interest} in Week ${week}.
Week Goal: "${goal}"
Topics: ${topics.join(', ')}
Concepts: ${concepts.join(', ')}
Practice tasks: ${practice.join(', ')}

Return ONLY raw JSON (no markdown):
{
  "ideas": [
    {
      "title": "string",
      "description": "string",
      "challenge": "string",
      "difficulty": "Easy|Medium|Hard",
      "key_outcomes": ["string", "string"],
      "steps": ["string", "string"]
    }
  ]
}`;

  if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an educational project planner. Output ONLY raw JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        },
        {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          timeout: 20000
        }
      );
      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) {
      console.error('OpenAI project ideas failed, using fallback:', err.message);
    }
  }

  return generateMockProjectIdeas(weekData, interest, level);
};

// ============================================================
// PRIVATE: Mock Project Ideas Generator
// ============================================================

function generateMockProjectIdeas(weekData, interest, level) {
  const week = weekData?.week || 1;
  const topics = weekData?.topics || [`Introduction to ${interest}`];
  
  return {
    ideas: [
      {
        title: `Build a Mini ${interest} Practice Sandbox`,
        description: `Create a lightweight playground project focused purely on implementing ${topics[0]}. This ensures you get hands-on experience without configuration overhead.`,
        challenge: `Implement the core logic of ${topics[0]} and write at least two custom features or configurations that demonstrate proper execution.`,
        difficulty: 'Easy',
        key_outcomes: [
          `Solidify understanding of ${topics[0]} syntax and operations`,
          `Learn to troubleshoot common beginner mistakes and console warnings`,
          `Establish a local development baseline for the subject`
        ],
        steps: [
          `Initialize a local project environment and install any required CLI/packages`,
          `Create a main module or file named after the core concept`,
          `Write a simple input/output loop or static interface implementing the week's goal`,
          `Manually trigger at least three different mock states to verify system robustness`
        ]
      },
      {
        title: `Interactive ${interest} Challenge Dashboard`,
        description: `Build an application or script that prompts users with challenges related to ${topics.slice(0, 2).join(' & ')} and displays outputs dynamically.`,
        challenge: `Construct a dashboard/interface that integrates at least 3 distinct tasks matching this week's goals and provides visual feedback.`,
        difficulty: 'Medium',
        key_outcomes: [
          `Connect multiple concepts like data binding, input parsing, and state preservation`,
          `Handle user input errors and show friendly error alerts`,
          `Demonstrate modular file structures by separating components or scripts`
        ],
        steps: [
          `Create a layout divided into Challenge description, User action space, and Console/output area`,
          `Implement a routing or toggle system to switch between 3 challenges`,
          `Add validation rules to ensure user inputs match the expected syntax or values`,
          `Apply modern UI highlights or terminal colors to indicate success states`
        ]
      },
      {
        title: `Enterprise-Ready ${interest} Portfolio Demo`,
        description: `Structure a production-ready application demonstrating advanced architecture for Week ${week} concepts: modular design, detailed logging, and mock testing.`,
        challenge: `Add custom config settings, unit tests, and write a README documenting how you handled performance optimizations.`,
        difficulty: 'Hard',
        key_outcomes: [
          `Apply clean code standards and scalable folders structure`,
          `Learn basic mock testing patterns and console log tracking`,
          `Build a portfolio-worthy demonstration of ${interest} skills`
        ],
        steps: [
          `Design a modular architecture separating core logic from data wrappers`,
          `Implement a configuration file managing environment variables or properties`,
          `Write at least two automated mock tests validating successful execution`,
          `Deploy/bundle the project and check for performance bottlenecks or bundle sizes`
        ]
      }
    ]
  };
}

