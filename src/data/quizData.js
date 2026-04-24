export const tracksData = [
  {
    id: "frontend",
    title: "Frontend Development",
    description: "React, Vue, HTML/CSS, UI architecture and responsive design.",
    icon: "code",
  },
  {
    id: "backend",
    title: "Backend Development",
    description: "Node.js, Python, Databases, API design and server architecture.",
    icon: "database",
  },
  {
    id: "ai",
    title: "AI / Machine Learning",
    description: "Data models, NLP, computer vision, and predictive algorithms.",
    icon: "brain",
  },
  {
    id: "uiux",
    title: "UI / UX Design",
    description: "Wireframing, prototyping, user research, and visual design.",
    icon: "design",
  },
];

export const quizData = {
  frontend: [
    {
      id: 1,
      question:
        "Which React hook is used to manage component state in functional components?",
      options: ["useEffect", "useState", "useContext", "useReducer"],
      correctAnswer: 1,
    },
    {
      id: 2,
      question: "What does CSS stand for?",
      options: [
        "Computer Style Sheets",
        "Creative Style System",
        "Cascading Style Sheets",
        "Colorful Style Syntax",
      ],
      correctAnswer: 2,
    },
    {
      id: 3,
      question: "Which HTML tag is used to create a hyperlink?",
      options: ["<p>", "<a>", "<link>", "<h1>"],
      correctAnswer: 1,
    },
    {
      id: 4,
      question: "What is the main purpose of JavaScript in web development?",
      options: [
        "To style web pages",
        "To structure content",
        "To add interactivity",
        "To store files",
      ],
      correctAnswer: 2,
    },
    {
      id: 5,
      question:
        "Which CSS property is used to make an element a flex container?",
      options: [
        "position: flex",
        "display: flex",
        "align-items: center",
        "flex-direction: row",
      ],
      correctAnswer: 1,
    },
    {
      id: 6,
      question: "What is the virtual DOM in React mainly used for?",
      options: [
        "Storing CSS rules",
        "Improving rendering performance",
        "Handling backend logic",
        "Managing databases",
      ],
      correctAnswer: 1,
    },
    {
      id: 7,
      question:
        "Which method is commonly used to loop through an array in React and render elements?",
      options: ["filter()", "reduce()", "map()", "push()"],
      correctAnswer: 2,
    },
    {
      id: 8,
      question: "Which of the following is a semantic HTML element?",
      options: ["<div>", "<span>", "<section>", "<b>"],
      correctAnswer: 2,
    },
    {
      id: 9,
      question: "What does responsive design mean?",
      options: [
        "Pages that load only on desktop",
        "Design that adapts to different screen sizes",
        "Design with only animations",
        "Design without CSS",
      ],
      correctAnswer: 1,
    },
    {
      id: 10,
      question: "Which tool is commonly used to manage frontend packages?",
      options: ["Git", "npm", "Figma", "Docker"],
      correctAnswer: 1,
    },
  ],

  backend: [
    {
      id: 1,
      question: "What is the main role of a backend server?",
      options: [
        "Styling the user interface",
        "Handling business logic and data processing",
        "Drawing icons",
        "Creating animations",
      ],
      correctAnswer: 1,
    },
    {
      id: 2,
      question: "Which HTTP method is commonly used to retrieve data?",
      options: ["POST", "DELETE", "GET", "PUT"],
      correctAnswer: 2,
    },
    {
      id: 3,
      question: "What does API stand for?",
      options: [
        "Application Programming Interface",
        "Advanced Program Internet",
        "Applied Process Integration",
        "Automated Programming Input",
      ],
      correctAnswer: 0,
    },
    {
      id: 4,
      question: "Which database type is MongoDB?",
      options: [
        "Relational database",
        "NoSQL database",
        "Spreadsheet database",
        "File-only database",
      ],
      correctAnswer: 1,
    },
    {
      id: 5,
      question: "What is authentication used for?",
      options: [
        "To check layout spacing",
        "To verify a user’s identity",
        "To increase image quality",
        "To cache CSS",
      ],
      correctAnswer: 1,
    },
    {
      id: 6,
      question: "What is the purpose of status code 404?",
      options: ["Success", "Unauthorized", "Not Found", "Server Error"],
      correctAnswer: 2,
    },
    {
      id: 7,
      question:
        "Which of the following is commonly used to secure passwords?",
      options: ["Sorting", "Hashing", "Compressing", "Copying"],
      correctAnswer: 1,
    },
    {
      id: 8,
      question: "What does CRUD stand for?",
      options: [
        "Create, Read, Update, Delete",
        "Copy, Run, Upload, Download",
        "Create, Remove, Undo, Deploy",
        "Connect, Render, Use, Debug",
      ],
      correctAnswer: 0,
    },
    {
      id: 9,
      question:
        "Which one is a common backend runtime environment for JavaScript?",
      options: ["Node.js", "React", "Tailwind CSS", "Bootstrap"],
      correctAnswer: 0,
    },
    {
      id: 10,
      question: "What is middleware in backend development?",
      options: [
        "A UI component",
        "A function between request and response processing",
        "A database table",
        "A CSS framework",
      ],
      correctAnswer: 1,
    },
  ],

  ai: [
    {
      id: 1,
      question: "What is machine learning?",
      options: [
        "A way to manually design websites",
        "A method that allows systems to learn from data",
        "A hardware device",
        "A database language",
      ],
      correctAnswer: 1,
    },
    {
      id: 2,
      question: "Which of the following is a supervised learning task?",
      options: [
        "Clustering",
        "Classification",
        "Dimensionality reduction",
        "Random grouping",
      ],
      correctAnswer: 1,
    },
    {
      id: 3,
      question: "What is a dataset?",
      options: [
        "A collection of data used for analysis or training",
        "A design file",
        "A network protocol",
        "A CSS file",
      ],
      correctAnswer: 0,
    },
    {
      id: 4,
      question: "What is the purpose of a training set?",
      options: [
        "To test final performance only",
        "To train the model",
        "To store passwords",
        "To draw charts only",
      ],
      correctAnswer: 1,
    },
    {
      id: 5,
      question:
        "Which metric is commonly used for classification accuracy?",
      options: ["Accuracy", "Resolution", "Opacity", "Saturation"],
      correctAnswer: 0,
    },
    {
      id: 6,
      question: "What is overfitting?",
      options: [
        "When a model performs well on training data but poorly on new data",
        "When a model is too fast",
        "When a model has no features",
        "When a model is deleted",
      ],
      correctAnswer: 0,
    },
    {
      id: 7,
      question:
        "Which of the following is a popular programming language for AI?",
      options: ["HTML", "Python", "CSS", "XML"],
      correctAnswer: 1,
    },
    {
      id: 8,
      question: "What is a feature in machine learning?",
      options: [
        "A button in the UI",
        "An input variable used by the model",
        "A server route",
        "A CSS animation",
      ],
      correctAnswer: 1,
    },
    {
      id: 9,
      question:
        "Which field focuses on enabling computers to understand human language?",
      options: ["Computer Vision", "NLP", "Networking", "UI Design"],
      correctAnswer: 1,
    },
    {
      id: 10,
      question: "What is the main goal of model evaluation?",
      options: [
        "To change the dataset color",
        "To measure how well the model performs",
        "To create a login page",
        "To connect to Wi-Fi",
      ],
      correctAnswer: 1,
    },
  ],

  uiux: [
    {
      id: 1,
      question: "What does UX stand for?",
      options: [
        "User XML",
        "User Experience",
        "Unified Extension",
        "User Execution",
      ],
      correctAnswer: 1,
    },
    {
      id: 2,
      question: "What does UI stand for?",
      options: [
        "User Interface",
        "Universal Interaction",
        "Unified Internet",
        "User Input",
      ],
      correctAnswer: 0,
    },
    {
      id: 3,
      question: "What is wireframing mainly used for?",
      options: [
        "Adding final colors and shadows",
        "Planning the structure and layout of a design",
        "Writing backend code",
        "Testing APIs",
      ],
      correctAnswer: 1,
    },
    {
      id: 4,
      question: "Which of the following is most related to usability?",
      options: [
        "How easy a product is to use",
        "The number of files in a project",
        "The backend database type",
        "The screen resolution only",
      ],
      correctAnswer: 0,
    },
    {
      id: 5,
      question: "What is a prototype?",
      options: [
        "A final deployed application only",
        "An early interactive model of a product",
        "A database backup",
        "A CSS reset file",
      ],
      correctAnswer: 1,
    },
    {
      id: 6,
      question: "Why is consistency important in UI design?",
      options: [
        "It reduces user confusion",
        "It makes code slower",
        "It removes all colors",
        "It replaces testing",
      ],
      correctAnswer: 0,
    },
    {
      id: 7,
      question: "What is the purpose of user research?",
      options: [
        "To understand user needs and behavior",
        "To install packages",
        "To optimize SQL queries",
        "To create animations only",
      ],
      correctAnswer: 0,
    },
    {
      id: 8,
      question:
        "Which color contrast practice improves accessibility?",
      options: [
        "Using very similar text and background colors",
        "Using strong contrast between text and background",
        "Avoiding all text",
        "Using random colors",
      ],
      correctAnswer: 1,
    },
    {
      id: 9,
      question: "What is the main goal of a good user flow?",
      options: [
        "To make navigation clear and logical",
        "To increase file size",
        "To reduce screen brightness",
        "To replace typography",
      ],
      correctAnswer: 0,
    },
    {
      id: 10,
      question: "Which tool is commonly used for UI/UX design?",
      options: ["Figma", "MongoDB", "Node.js", "Postman"],
      correctAnswer: 0,
    },
  ],
};