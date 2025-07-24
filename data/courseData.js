import mongoose from "mongoose";

export const exampleCourse = {
  title: "Mastering JavaScript for Web Development",
  description: "Dive deep into JavaScript fundamentals and advanced concepts, enabling you to build dynamic, interactive web applications with confidence.",
  category: "Web Development",
  imageUrl: "https://miro.medium.com/v2/resize:fit:1200/1*LyZcwuLWv2FArOumCxobpA.png",
  topics: [
    {
      title: "JavaScript Fundamentals",
      skills: [,
        {
          skillTitle: "ES6 Classes Mastery",
          content: `
            <section class="skill-content">
              <h2 class="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">ES6 Classes: Modern OOP in JavaScript</h2>
              
              <div class="mb-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 class="text-2xl font-semibold mb-4 text-blue-600">Class Fundamentals</h3>
                <p class="mb-4 text-gray-700 leading-relaxed">
                  ES6 classes are syntactic sugar over JavaScript's prototypal inheritance, providing cleaner syntax for object creation and inheritance.
                </p>
                
                <div class="grid md:grid-cols-2 gap-6 mb-6">
                  <div class="bg-white p-5 shadow rounded-lg">
                    <h4 class="font-bold mb-3">Basic Class Syntax</h4>
                    <pre class="bg-gray-800 text-green-400 p-4 rounded"><code>class Rectangle {
          constructor(height, width) {
            this.height = height;
            this.width = width;
          }
          
          // Instance method
          calcArea() {
            return this.height * this.width;
          }
          
          // Static method
          static createSquare(size) {
            return new Rectangle(size, size);
          }
        }</code></pre>
                  </div>
                  
                  <div class="bg-white p-5 shadow rounded-lg">
                    <h4 class="font-bold mb-3">Under the Hood</h4>
                    <pre class="bg-gray-800 text-green-400 p-4 rounded"><code>// What actually happens:
        function Rectangle(height, width) {
          this.height = height;
          this.width = width;
        }
        
        Rectangle.prototype.calcArea = function() {
          return this.height * this.width;
        };
        
        Rectangle.createSquare = function(size) {
          return new Rectangle(size, size);
        };</code></pre>
                  </div>
                </div>
                
                <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  <p class="font-medium text-yellow-800">Key Insight:</p>
                  <p class="text-gray-700">Classes don't introduce new OOP model - they provide cleaner syntax for existing prototypal inheritance.</p>
                </div>
              </div>
              
              <div class="mb-10">
                <h3 class="text-2xl font-semibold mb-4 text-blue-600">Advanced Class Features</h3>
                
                <div class="mb-6 grid md:grid-cols-2 gap-6">
                  <div class="bg-white p-5 shadow rounded-lg">
                    <h4 class="text-xl font-medium mb-3 text-gray-800">Getters & Setters</h4>
                    <pre class="bg-gray-800 text-green-400 p-4 rounded"><code>class Temperature {
          constructor(celsius) {
            this.celsius = celsius;
          }
          
          get fahrenheit() {
            return this.celsius * 1.8 + 32;
          }
          
          set fahrenheit(value) {
            this.celsius = (value - 32) / 1.8;
          }
        }
        
        const temp = new Temperature(25);
        console.log(temp.fahrenheit); // 77
        temp.fahrenheit = 86;
        console.log(temp.celsius);    // 30</code></pre>
                  </div>
                  
                  <div class="bg-white p-5 shadow rounded-lg">
                    <h4 class="text-xl font-medium mb-3 text-gray-800">Private Fields (#)</h4>
                    <pre class="bg-gray-800 text-green-400 p-4 rounded"><code>class BankAccount {
          #balance = 0;  // Private field
          
          deposit(amount) {
            this.#balance += amount;
          }
          
          get balance() {
            return this.#balance;
          }
        }
        
        const account = new BankAccount();
        account.deposit(500);
        console.log(account.balance); // 500
        console.log(account.#balance); // SyntaxError</code></pre>
                  </div>
                </div>
                
                <div class="bg-gray-50 p-6 rounded-lg">
                  <h4 class="text-xl font-medium mb-3 text-gray-800">Inheritance with <code>extends</code></h4>
                  <pre class="bg-gray-800 text-green-400 p-4 rounded mb-4"><code>class Animal {
          constructor(name) {
            this.name = name;
          }
          
          speak() {
            console.log(\`\${this.name} makes a noise.\`);
          }
        }
        
        class Dog extends Animal {
          constructor(name, breed) {
            super(name);
            this.breed = breed;
          }
          
          speak() {
            console.log(\`\${this.name} barks!\`);
          }
          
          fetch() {
            console.log(\`\${this.name} fetches the ball!\`);
          }
        }
        
        const dog = new Dog('Rex', 'Labrador');
        dog.speak(); // Rex barks!</code></pre>
                  
                  <div class="bg-pink-50 p-4 rounded border-l-4 border-pink-400">
                    <p class="font-medium text-pink-800">Super Keyword:</p>
                    <ul class="list-disc pl-6 mt-2 text-gray-700">
                      <li><code>super()</code> calls parent class constructor</li>
                      <li><code>super.method()</code> calls parent class methods</li>
                      <li>Must call <code>super()</code> before accessing <code>this</code></li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="mb-8 bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 class="text-2xl font-semibold mb-4 text-blue-600">Class Design Patterns</h3>
                
                <div class="mb-6">
                  <h4 class="text-xl font-medium mb-3 text-gray-800">Mixins</h4>
                  <pre class="bg-gray-800 text-green-400 p-4 rounded"><code>// Mixin as function returning class
        const Serializable = Base => class extends Base {
          serialize() {
            return JSON.stringify(this);
          }
        };
        
        class User {
          constructor(name) {
            this.name = name;
          }
        }
        
        const SerializableUser = Serializable(User);
        const user = new SerializableUser('Alice');
        console.log(user.serialize()); // {"name":"Alice"}</code></pre>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                  <div class="bg-white p-5 shadow rounded-lg">
                    <h4 class="text-xl font-medium mb-3 text-gray-800">Abstract Base Classes</h4>
                    <pre class="bg-gray-800 text-green-400 p-4 rounded"><code>class AbstractShape {
          constructor() {
            if (new.target === AbstractShape) {
              throw new Error("Cannot instantiate abstract class");
            }
          }
          
          area() {
            throw new Error("Method 'area()' must be implemented");
          }
        }
        
        class Circle extends AbstractShape {
          constructor(radius) {
            super();
            this.radius = radius;
          }
          
          area() {
            return Math.PI * this.radius ** 2;
          }
        }</code></pre>
                  </div>
                  
                  <div class="bg-white p-5 shadow rounded-lg">
                    <h4 class="text-xl font-medium mb-3 text-gray-800">Singleton Pattern</h4>
                    <pre class="bg-gray-800 text-green-400 p-4 rounded"><code>class DatabaseConnection {
          static #instance;
          
          constructor() {
            if (DatabaseConnection.#instance) {
              return DatabaseConnection.#instance;
            }
            DatabaseConnection.#instance = this;
            // Initialize connection
          }
          
          static getInstance() {
            return DatabaseConnection.#instance || 
                   new DatabaseConnection();
          }
        }
        
        const db1 = new DatabaseConnection();
        const db2 = new DatabaseConnection();
        console.log(db1 === db2); // true</code></pre>
                  </div>
                </div>
              </div>
              
              <div class="bg-purple-50 p-6 rounded-lg mt-8 border border-purple-200">
                <h3 class="text-2xl font-semibold mb-4 text-purple-700">Performance & Best Practices</h3>
                <div class="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 class="text-lg font-medium mb-2 text-gray-800">Memory Optimization</h4>
                    <ul class="list-disc pl-6 space-y-1 text-gray-700">
                      <li>Methods are shared via prototype (memory efficient)</li>
                      <li>Avoid arrow functions as methods (breaks <code>this</code> binding)</li>
                      <li>Use private fields for true encapsulation</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 class="text-lg font-medium mb-2 text-gray-800">When to Use Classes</h4>
                    <ul class="list-disc pl-6 space-y-1 text-gray-700">
                      <li>Creating many similar objects</li>
                      <li>When inheritance hierarchy is needed</li>
                      <li>For React class components (though hooks are preferred now)</li>
                    </ul>
                  </div>
                </div>
                
                <div class="mt-4 bg-white p-4 rounded shadow-inner">
                  <h4 class="font-medium mb-2">Browser Support Table</h4>
                  <div class="overflow-x-auto">
                    <table class="min-w-full bg-white">
                      <thead>
                        <tr class="bg-gray-100">
                          <th class="py-2 px-4 border">Feature</th>
                          <th class="py-2 px-4 border">Chrome</th>
                          <th class="py-2 px-4 border">Firefox</th>
                          <th class="py-2 px-4 border">Safari</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="py-2 px-4 border">Class syntax</td>
                          <td class="py-2 px-4 border">49+</td>
                          <td class="py-2 px-4 border">45+</td>
                          <td class="py-2 px-4 border">10.1+</td>
                        </tr>
                        <tr>
                          <td class="py-2 px-4 border">Private fields</td>
                          <td class="py-2 px-4 border">74+</td>
                          <td class="py-2 px-4 border">90+</td>
                          <td class="py-2 px-4 border">14.1+</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          `
        },
        {
          skillTitle: "Promises Deep Dive",
          content: `
            <section class="skill-content">
              <h2 class="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Mastering JavaScript Promises</h2>
              
              <div class="mb-8">
                <h3 class="text-2xl font-semibold mb-4 text-blue-600">The Promise Lifecycle</h3>
                <p class="mb-4 text-gray-700 leading-relaxed">
                  Every Promise goes through a strict lifecycle with three possible states:
                </p>
                
                <div class="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                  <h4 class="font-mono text-lg mb-3 text-purple-700">State Transition Diagram:</h4>
                  <pre class="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
        Pending → Fulfilled (with value)
              ↘ Rejected (with reason)</pre>
                  
                  <ul class="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                    <li><strong>Pending:</strong> Initial state, neither fulfilled nor rejected</li>
                    <li><strong>Fulfilled:</strong> Operation completed successfully</li>
                    <li><strong>Rejected:</strong> Operation failed</li>
                    <li><strong>Settled:</strong> Either fulfilled or rejected (terminal state)</li>
                  </ul>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6 mb-8">
                  <div class="bg-white p-5 shadow rounded-lg border border-blue-100">
                    <h4 class="font-bold mb-3 text-lg">Creating Promises</h4>
                    <pre class="bg-gray-100 p-3 rounded text-sm"><code>const promise = new Promise((resolve, reject) => {
          // Asynchronous operation
          if (success) {
            resolve(value); // Transition to fulfilled
          } else {
            reject(reason); // Transition to rejected
          }
        });</code></pre>
                  </div>
                  
                  <div class="bg-white p-5 shadow rounded-lg border border-green-100">
                    <h4 class="font-bold mb-3 text-lg">Promise Chaining</h4>
                    <pre class="bg-gray-100 p-3 rounded text-sm"><code>fetch('/api/data')
          .then(response => response.json())
          .then(data => processData(data))
          .catch(error => handleError(error));</code></pre>
                  </div>
                </div>
              </div>
              
              <div class="mb-10">
                <h3 class="text-2xl font-semibold mb-4 text-blue-600">Advanced Promise Patterns</h3>
                
                <div class="mb-6">
                  <h4 class="text-xl font-medium mb-3 text-gray-800">Error Handling Strategies</h4>
                  <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 mb-4">
                    <p class="font-medium text-yellow-800">Best Practice:</p>
                    <p class="text-gray-700">Always terminate promise chains with .catch()</p>
                  </div>
                  
                  <pre class="bg-gray-800 text-green-400 p-4 rounded mb-4"><code>// Three equivalent error handling approaches:
        promise.then(handleSuccess).catch(handleError);
        
        promise.then(handleSuccess, handleError);
        
        promise.then(handleSuccess).then(null, handleError);</code></pre>
                  
                  <p class="text-gray-700 mb-4">Subtle differences in error bubbling behavior:</p>
                  <ul class="list-disc pl-6 space-y-2 text-gray-700">
                    <li>.catch() handles errors from all previous .then() handlers</li>
                    <li>Error handler in .then() only catches errors from the immediate operation</li>
                  </ul>
                </div>
                
                <div class="bg-gray-50 p-6 rounded-lg mb-6">
                  <h4 class="text-xl font-medium mb-3 text-gray-800">Promise Combinators</h4>
                  
                  <div class="grid md:grid-cols-3 gap-4">
                    <div class="bg-white p-4 rounded shadow">
                      <h5 class="font-bold mb-2">Promise.all()</h5>
                      <p class="text-sm text-gray-600 mb-2">Waits for all promises to fulfill or any to reject</p>
                      <pre class="bg-gray-100 p-2 rounded text-xs"><code>Promise.all([p1, p2, p3])
          .then(values => {
            // Array of results
          });</code></pre>
                    </div>
                    
                    <div class="bg-white p-4 rounded shadow">
                      <h5 class="font-bold mb-2">Promise.race()</h5>
                      <p class="text-sm text-gray-600 mb-2">Settles when any promise settles</p>
                      <pre class="bg-gray-100 p-2 rounded text-xs"><code>Promise.race([p1, p2])
          .then(firstResult => {
            // First settled value
          });</code></pre>
                    </div>
                    
                    <div class="bg-white p-4 rounded shadow">
                      <h5 class="font-bold mb-2">Promise.allSettled()</h5>
                      <p class="text-sm text-gray-600 mb-2">Waits for all promises to complete</p>
                      <pre class="bg-gray-100 p-2 rounded text-xs"><code>Promise.allSettled([p1, p2])
          .then(results => {
            // Array of status objects
          });</code></pre>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mb-8">
                <h3 class="text-2xl font-semibold mb-4 text-blue-600">Real-World Promise Use Cases</h3>
                
                <div class="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
                  <h4 class="text-xl font-medium mb-3 text-gray-800">API Request Handling</h4>
                  <pre class="bg-gray-800 text-green-400 p-4 rounded"><code>function fetchUserData(userId) {
          return fetch(\`/api/users/\${userId}\`)
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response failed');
              }
              return response.json();
            })
            .then(data => transformUserData(data))
            .catch(error => {
              console.error('Fetch error:', error);
              throw error; // Re-throw for further handling
            });
        }</code></pre>
                </div>
                
                <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h4 class="text-xl font-medium mb-3 text-gray-800">Timeout Patterns</h4>
                  <pre class="bg-gray-800 text-green-400 p-4 rounded"><code>function withTimeout(promise, timeout) {
          return Promise.race([
            promise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeout)
            )
          ]);
        }
        
        // Usage:
        withTimeout(fetch('/slow-api'), 5000)
          .then(handleResponse)
          .catch(error => {
            if (error.message === 'Timeout') {
              showTimeoutMessage();
            }
          });</code></pre>
                </div>
              </div>
              
              <div class="bg-purple-50 p-6 rounded-lg mt-8 border border-purple-200">
                <h3 class="text-2xl font-semibold mb-4 text-purple-700">Performance Considerations</h3>
                <ul class="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Microtask Queue:</strong> Promise callbacks execute as microtasks (before next render frame)</li>
                  <li><strong>Memory Leaks:</strong> Unhandled promise rejections can cause memory leaks in Node.js</li>
                  <li><strong>Optimization:</strong> Avoid unnecessary promise creation in tight loops</li>
                  <li><strong>Debugging:</strong> Use <code>unhandledrejection</code> event for global error handling</li>
                </ul>
                
                <div class="mt-4 bg-white p-4 rounded shadow-inner">
                  <pre class="bg-gray-800 text-green-400 p-3 rounded"><code>// Global rejection handler
        window.addEventListener('unhandledrejection', event => {
          console.warn('Unhandled rejection:', event.reason);
          event.preventDefault();
        });</code></pre>
                </div>
              </div>
            </section>
          `
        },
        {
          skillTitle: "Variables and Data Types",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Understanding Variables in JavaScript</h2>
              <p class="mb-4">Variables are the fundamental building blocks of any programming language. In JavaScript, we have three ways to declare variables: <code>var</code>, <code>let</code>, and <code>const</code>. Each has distinct characteristics that affect how your code behaves.</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// Variable declaration examples
var oldSchool = "function scoped";
let modernVar = "block scoped"; 
const constantVar = "cannot be reassigned";</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Variable Scoping and Hoisting</h2>
              <p class="mb-4">JavaScript has function-level scoping with <code>var</code> and block-level scoping with <code>let</code>/<code>const</code>. Hoisting is JavaScript's behavior of moving declarations to the top of their containing scope.</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>console.log(hoistedVar); // undefined (var is hoisted)
var hoistedVar = "value";

console.log(letVar); // ReferenceError (let isn't hoisted)
let letVar = "value";</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Primitive Data Types</h2>
              <p class="mb-4">JavaScript has seven primitive data types that are immutable (cannot be changed):</p>
              
              <ul class="list-disc pl-6 mb-4">
                <li><strong>String</strong>: Textual data ("hello")</li>
                <li><strong>Number</strong>: Both integers and floats (42, 3.14)</li>
                <li><strong>Boolean</strong>: true/false values</li>
                <li><strong>Null</strong>: Intentional absence of value</li>
                <li><strong>Undefined</strong>: Variable declared but not assigned</li>
                <li><strong>Symbol</strong>: Unique, immutable identifiers</li>
                <li><strong>BigInt</strong>: Arbitrary precision integers</li>
              </ul>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Type Coercion and Conversion</h2>
              <p class="mb-4">JavaScript is dynamically typed, which means type coercion happens automatically in certain contexts:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// Type coercion examples
console.log(8 + "2"); // "82" (number to string)
console.log("5" == 5); // true (loose equality)
console.log("5" === 5); // false (strict equality)</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Best Practices</h2>
              <p class="mb-4">Modern JavaScript development recommends:</p>
              
              <ul class="list-disc pl-6 mb-4">
                <li>Always use <code>const</code> by default</li>
                <li>Use <code>let</code> when you need to reassign</li>
                <li>Avoid <code>var</code> in new code</li>
                <li>Use strict equality (<code>===</code>)</li>
                <li>Be explicit with type conversions</li>
              </ul>
            </section>
          `
        },
        {
          skillTitle: "Functions and Scope",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Function Declarations vs Expressions</h2>
              <p class="mb-4">Functions in JavaScript can be declared in several ways, each with subtle differences in behavior:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// Function declaration (hoisted)
function greet(name) {
  return \`Hello, \${name}\`;
}

// Function expression (not hoisted)
const square = function(x) {
  return x * x;
};

// Arrow function (ES6+)
const add = (a, b) => a + b;</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Understanding Scope</h2>
              <p class="mb-4">Scope determines where variables are accessible in your code. JavaScript has three types of scope:</p>
              
              <ul class="list-disc pl-6 mb-4">
                <li><strong>Global scope</strong>: Accessible everywhere</li>
                <li><strong>Function scope</strong>: Variables declared with <code>var</code></li>
                <li><strong>Block scope</strong>: Variables declared with <code>let</code>/<code>const</code></li>
              </ul>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Closures</h2>
              <p class="mb-4">A closure is a function that remembers its outer variables and can access them. This powerful feature enables patterns like data privacy and function factories.</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>function createCounter() {
  let count = 0;
  return function() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Immediately Invoked Function Expressions (IIFE)</h2>
              <p class="mb-4">IIFEs allow you to execute functions immediately while creating private scope:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>(function() {
  const privateVar = "secret";
  console.log(privateVar); // "secret"
})();

console.log(privateVar); // ReferenceError</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Arrow Functions vs Regular Functions</h2>
              <p class="mb-4">Arrow functions (introduced in ES6) have several key differences:</p>
              
              <ul class="list-disc pl-6 mb-4">
                <li>No <code>this</code> binding (lexical <code>this</code>)</li>
                <li>Can't be used as constructors</li>
                <li>No <code>arguments</code> object</li>
                <li>Shorter syntax</li>
              </ul>
            </section>
          `
        }
      ],
      quiz: [
        {
          question: "Which variable declaration is block-scoped?",
          options: ["var", "let", "const", "Both let and const"],
          correctAnswer: "Both let and const"
        },
        {
          question: "What is the value of typeof null?",
          options: ["null", "object", "undefined", "string"],
          correctAnswer: "object"
        },
        {
          question: "Which function type has its own this binding?",
          options: ["Arrow functions", "Regular functions", "Both", "Neither"],
          correctAnswer: "Regular functions"
        }
      ],
    },
    {
      title: "Functional Programming in JavaScript",
      skills: [
        {
          skillTitle: "Functional Programming Paradigm",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Core Principles</h2>
              <p class="mb-4">Functional programming (FP) emphasizes pure functions, immutability, and function composition. While JavaScript isn't purely functional, it supports FP patterns well.</p>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Pure Functions</h2>
              <p class="mb-4">Pure functions always return the same output for the same inputs and have no side effects:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// Pure
function add(a, b) {
  return a + b;
}

// Impure (relies on external state)
let taxRate = 0.1;
function calculateTax(amount) {
  return amount * taxRate;
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Immutability</h2>
              <p class="mb-4">Treating data as immutable leads to more predictable code. Modern JavaScript helps with:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// Arrays
const original = [1, 2, 3];
const updated = [...original, 4]; // Not original.push(4)

// Objects
const user = { name: 'Alice' };
const updatedUser = { ...user, age: 30 };</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Higher-Order Functions</h2>
              <p class="mb-4">Functions that operate on other functions (taking them as arguments or returning them):</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// HOF that takes a function
function repeat(n, action) {
  for (let i = 0; i < n; i++) {
    action(i);
  }
}

// HOF that returns a function
function multiplier(factor) {
  return x => x * factor;
}
const double = multiplier(2);</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Array Operations</h2>
              <p class="mb-4">FP shines with array transformations:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>const numbers = [1, 2, 3, 4];

// Map (transform)
const squared = numbers.map(x => x * x);

// Filter (select)
const evens = numbers.filter(x => x % 2 === 0);

// Reduce (accumulate)
const sum = numbers.reduce((acc, x) => acc + x, 0);</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Function Composition</h2>
              <p class="mb-4">Building complex operations by combining simple functions:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>const compose = (...fns) => 
  x => fns.reduceRight((v, f) => f(v), x);

const add5 = x => x + 5;
const multiply3 = x => x * 3;
const format = x => \`\${x.toFixed(2)}\`;

const process = compose(format, multiply3, add5);
console.log(process(10)); // "45.00"</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Currying</h2>
              <p class="mb-4">Transforming multi-argument functions into sequences of single-argument functions:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// Regular function
function add(a, b) {
  return a + b;
}

// Curried version
function curryAdd(a) {
  return function(b) {
    return a + b;
  }
}
const add5 = curryAdd(5);
console.log(add5(3)); // 8</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Recursion</h2>
              <p class="mb-4">FP favors recursion over loops for iteration:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Tail-call optimized version
function factorial(n, acc = 1) {
  if (n <= 1) return acc;
  return factorial(n - 1, n * acc);
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Libraries & Practical FP</h2>
              <p class="mb-4">Popular FP libraries include Ramda and Lodash/fp. Key practical applications:</p>
              
              <ul class="list-disc pl-6 mb-4">
                <li>Redux reducers must be pure functions</li>
                <li>React components benefit from purity</li>
                <li>Data transformation pipelines</li>
                <li>Immutable state management</li>
              </ul>
            </section>
          `
        }
      ],
      quiz: [
        {
          question: "Which array method is used for transformation?",
          options: ["filter", "map", "reduce", "forEach"],
          correctAnswer: "map"
        },
        {
          question: "What is a pure function?",
          options: [
            "A function with no parameters",
            "A function that doesn't return anything",
            "A function with no side effects",
            "A function that only works with arrays"
          ],
          correctAnswer: "A function with no side effects"
        }
      ]
    }
  ],
  creator: new mongoose.Types.ObjectId("6876c09b8781b3ea002fc48b"),
  dateCreated: new Date(),
  isPublished: true
};


export const cssMasteryCourse = {
  title: "Mastering Modern CSS Development",
  description: "Go from CSS basics to advanced layout techniques including Flexbox, Grid, animations and responsive design principles.",
  category: "Web Development",
  imageUrl: "https://miro.medium.com/v2/resize:fit:1200/1*OFsc0SD55jhi8cjo7aCA4w.jpeg",
  topics: [
    {
      title: "CSS Fundamentals",
      skills: [
        {
          skillTitle: "Selectors and Specificity",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">CSS Selectors Deep Dive</h2>
              <p class="mb-4">CSS selectors are patterns used to select the elements you want to style. Understanding them is crucial for writing efficient CSS.</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>/* Basic selectors */
.element { }          /* Class selector */
#element { }          /* ID selector */
div { }               /* Element selector */
[attribute] { }       /* Attribute selector */

/* Combinators */
div > p { }           /* Child selector */
div + p { }           /* Adjacent sibling */
div ~ p { }           /* General sibling */

/* Pseudo-classes */
a:hover { }
input:focus { }
li:nth-child(2n) { }</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Specificity Hierarchy</h2>
              <p class="mb-4">When multiple rules apply, specificity determines which styles get applied:</p>
              
              <ol class="list-decimal pl-6 mb-4">
                <li>Inline styles (1000 points)</li>
                <li>IDs (100 points)</li>
                <li>Classes, attributes, pseudo-classes (10 points)</li>
                <li>Elements, pseudo-elements (1 point)</li>
              </ol>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Important Rules</h2>
              <p class="mb-4">The <code>!important</code> rule overrides all other declarations, but should be used sparingly:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>.warning {
  color: red !important;
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Best Practices</h2>
              <ul class="list-disc pl-6 mb-4">
                <li>Prefer classes over IDs for styling</li>
                <li>Keep specificity low for maintainability</li>
                <li>Use semantic class names (BEM methodology)</li>
                <li>Avoid overqualifying selectors (div.nav is unnecessary if .nav is unique)</li>
              </ul>
            </section>
          `
        },
        {
          skillTitle: "Box Model and Layout",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Understanding the Box Model</h2>
              <p class="mb-4">Every element in CSS is a rectangular box with content, padding, border, and margin areas.</p>
              
              <div class="bg-gray-100 p-4 rounded mb-4">
                <div class="border border-gray-400 p-2 mb-2">
                  <div class="bg-blue-100 p-4 border-2 border-blue-500">
                    <div class="bg-blue-200 p-4 text-center">Content</div>
                  </div>
                </div>
                <div class="flex justify-between text-sm">
                  <span>Margin</span>
                  <span>Border</span>
                  <span>Padding</span>
                </div>
              </div>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Box-Sizing Property</h2>
              <p class="mb-4">The <code>box-sizing</code> property changes how element dimensions are calculated:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>/* Traditional box model */
box-sizing: content-box; /* width = content width */

/* Modern box model */
box-sizing: border-box; /* width = content + padding + border */</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Display Property</h2>
              <p class="mb-4">The display property specifies the display behavior of an element:</p>
              
              <ul class="list-disc pl-6 mb-4">
                <li><code>block</code>: Starts on a new line and takes full width</li>
                <li><code>inline</code>: Flows with text, no width/height</li>
                <li><code>inline-block</code>: Flows like inline but accepts dimensions</li>
                <li><code>flex</code>: Enables flexbox layout</li>
                <li><code>grid</code>: Enables grid layout</li>
                <li><code>none</code>: Removes from flow entirely</li>
              </ul>
            </section>
          `
        }
      ],
      quiz: [
        {
          question: "Which selector has the highest specificity?",
          options: ["Class", "ID", "Element", "Attribute"],
          correctAnswer: "ID"
        },
        {
          question: "What does box-sizing: border-box do?",
          options: [
            "Includes padding and border in element's width",
            "Excludes margin from element's width",
            "Adds extra border space",
            "Makes element responsive"
          ],
          correctAnswer: "Includes padding and border in element's width"
        }
      ],
      feedbackRoom: {},
    },
    {
      title: "Flexbox Layout",
      skills: [
        {
          skillTitle: "Flexbox Fundamentals",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Flex Container Properties</h2>
              <p class="mb-4">Flexbox requires a container with <code>display: flex</code>. Key container properties:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>.container {
  display: flex;
  flex-direction: row | row-reverse | column | column-reverse;
  flex-wrap: nowrap | wrap | wrap-reverse;
  justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly;
  align-items: stretch | flex-start | flex-end | center | baseline;
  gap: 10px; /* Space between items */
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Flex Item Properties</h2>
              <p class="mb-4">Direct children become flex items with these properties:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>.item {
  order: 5; /* Default 0, reorder visually */
  flex-grow: 0; /* Ability to grow if space available */
  flex-shrink: 1; /* Ability to shrink if needed */
  flex-basis: auto | length; /* Default size before growing/shrinking */
  align-self: auto | flex-start | flex-end | center | baseline | stretch;
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Practical Flexbox Patterns</h2>
              <p class="mb-4">Common layout solutions with flexbox:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>/* Perfect centering */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Equal height columns */
.container {
  display: flex;
}

/* Sticky footer */
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.content { flex: 1; }</code></pre>
            </section>
          `
        }
      ],
      quiz: [
        {
          question: "Which property aligns items along the main axis?",
          options: ["align-items", "justify-content", "align-content", "flex-direction"],
          correctAnswer: "justify-content"
        }
      ]
    },
    {
      title: "CSS Grid Layout",
      skills: [
        {
          skillTitle: "Grid Fundamentals",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Creating a Grid Container</h2>
              <p class="mb-4">CSS Grid provides a two-dimensional layout system. Start with:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>.container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr; /* 3 equal columns */
  grid-template-rows: 100px auto 100px; /* 3 rows */
  gap: 20px; /* Space between items */
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Grid Template Areas</h2>
              <p class="mb-4">Visual layout system with named areas:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>.container {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar content content"
    "footer footer footer";
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.footer { grid-area: footer; }</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Responsive Grids</h2>
              <p class="mb-4">Create responsive layouts without media queries:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}</code></pre>
            </section>
          `
        }
      ],
      quiz: [
        {
          question: "What does 1fr unit represent?",
          options: ["Fixed 16px", "Fraction of available space", "Viewport width", "Flex grow value"],
          correctAnswer: "Fraction of available space"
        }
      ],
    },
    {
      title: "Advanced CSS Techniques",
      skills: [
        {
          skillTitle: "CSS Animations and Transitions",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">CSS Transitions</h2>
              <p class="mb-4">Smoothly animate property changes:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>.box {
  transition: all 0.3s ease-out;
  /* Shorthand for: */
  transition-property: all;
  transition-duration: 0.3s;
  transition-timing-function: ease-out;
  transition-delay: 0s;
}

.box:hover {
  transform: scale(1.1);
  background: blue;
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Keyframe Animations</h2>
              <p class="mb-4">Create complex multi-step animations:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>@keyframes slidein {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.element {
  animation: slidein 0.5s ease-in-out;
  animation-iteration-count: infinite;
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">CSS Variables</h2>
              <p class="mb-4">Custom properties for reusable values:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>:root {
  --primary-color: #3498db;
  --spacing: 16px;
}

.element {
  color: var(--primary-color);
  margin: var(--spacing);
}</code></pre>
            </section>
          `
        }
      ],
      quiz: [
        {
          question: "Which property defines the acceleration curve of a transition?",
          options: ["transition-duration", "transition-timing-function", "transition-delay", "transition-property"],
          correctAnswer: "transition-timing-function"
        }
      ]
    }
  ],
  creator: new mongoose.Types.ObjectId("6876c09b8781b3ea002fc48b"),
  dateCreated: new Date(),
  isPublished: true
};


export const pythonCourse = {

  title: "Python Programming Mastery",
  description: "Learn Python from fundamentals to advanced concepts, including OOP, data structures, and popular frameworks for building robust applications.",
  category: "Programming",
  imageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*RJMxLdTHqVBSijKmOO5MAg.jpeg",
  topics: [
    {
      title: "Python Fundamentals",
      skills: [
        {
          skillTitle: "Variables and Data Structures",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Python Variables</h2>
              <p class="mb-4">Python uses dynamic typing and has several basic data types:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code># Variable examples
name = "Alice"          # String
age = 30                # Integer
price = 19.99           # Float
is_active = True        # Boolean
fruits = ["apple", "banana"]  # List</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Core Data Structures</h2>
              <p class="mb-4">Python has several built-in data structures:</p>
              
              <ul class="list-disc pl-6 mb-4">
                <li><strong>Lists</strong>: Mutable ordered sequences <code>[1, 2, 3]</code></li>
                <li><strong>Tuples</strong>: Immutable ordered sequences <code>(1, 2, 3)</code></li>
                <li><strong>Dictionaries</strong>: Key-value pairs <code>{"name": "Alice", "age": 30}</code></li>
                <li><strong>Sets</strong>: Unordered unique elements <code>{"apple", "banana"}</code></li>
              </ul>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Type Conversion</h2>
              <p class="mb-4">Python provides built-in functions for type conversion:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code># Type conversion examples
num_str = "42"
num_int = int(num_str)   # Convert to integer
num_float = float(num_str) # Convert to float
str_num = str(42)        # Convert to string</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Best Practices</h2>
              <p class="mb-4">Python style guidelines (PEP 8) recommend:</p>
              
              <ul class="list-disc pl-6 mb-4">
                <li>Use snake_case for variable names</li>
                <li>Use 4 spaces per indentation level</li>
                <li>Keep lines under 79 characters</li>
                <li>Use descriptive variable names</li>
              </ul>
            </section>
          `
        },
        {
          skillTitle: "Control Flow and Functions",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Conditional Statements</h2>
              <p class="mb-4">Python uses indentation to define code blocks:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code># If-elif-else example
age = 18
if age < 13:
    print("Child")
elif age < 18:
    print("Teen")
else:
    print("Adult")</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Loops</h2>
              <p class="mb-4">Python has two main loop types:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code># For loop
for fruit in ["apple", "banana"]:
    print(fruit)

# While loop
count = 0
while count < 5:
    print(count)
    count += 1</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Functions</h2>
              <p class="mb-4">Functions are defined with the <code>def</code> keyword:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code># Function definition
def greet(name):
    return f"Hello, {name}!"

# Function with default parameter
def power(base, exponent=2):
    return base ** exponent</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Lambda Functions</h2>
              <p class="mb-4">Anonymous functions for simple operations:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code># Lambda example
square = lambda x: x * x
numbers = [1, 2, 3]
squared = list(map(lambda x: x**2, numbers))</code></pre>
            </section>
          `
        }
      ],
      quiz: [
        {
          question: "Which data structure is immutable?",
          options: ["List", "Dictionary", "Tuple", "Set"],
          correctAnswer: "Tuple"
        },
        {
          question: "What is the correct way to define a function?",
          options: [
            "function greet():",
            "def greet():",
            "greet = function():",
            "define greet():"
          ],
          correctAnswer: "def greet():"
        }
      ]
    },
    {
      title: "Object-Oriented Programming in Python",
      skills: [
        {
          skillTitle: "Classes and Objects",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Class Definition</h2>
              <p class="mb-4">Classes are defined using the <code>class</code> keyword:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code># Simple class example
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def greet(self):
        return f"Hello, my name is {self.name}"

# Create instance
alice = Person("Alice", 30)
print(alice.greet())</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Inheritance</h2>
              <p class="mb-4">Python supports single and multiple inheritance:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code># Inheritance example
class Animal:
    def __init__(self, name):
        self.name = name
    
    def speak(self):
        raise NotImplementedError

class Dog(Animal):
    def speak(self):
        return "Woof!"

class Cat(Animal):
    def speak(self):
        return "Meow!"</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Magic Methods</h2>
              <p class="mb-4">Special methods that start and end with double underscores:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code># __str__ example
class Book:
    def __init__(self, title, author):
        self.title = title
        self.author = author
    
    def __str__(self):
        return f"{self.title} by {self.author}"

book = Book("Python 101", "John Doe")
print(book)  # Calls __str__ automatically</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Properties</h2>
              <p class="mb-4">Using getters and setters with the <code>@property</code> decorator:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>class Circle:
    def __init__(self, radius):
        self._radius = radius
    
    @property
    def radius(self):
        return self._radius
    
    @radius.setter
    def radius(self, value):
        if value > 0:
            self._radius = value
        else:
            raise ValueError("Radius must be positive")</code></pre>
            </section>
          `
        }
      ],
      quiz: [
        {
          question: "Which method is called when creating an object?",
          options: ["__init__", "__new__", "__create__", "__start__"],
          correctAnswer: "__init__"
        },
        {
          question: "What does the @property decorator do?",
          options: [
            "Marks a method as static",
            "Creates a getter method",
            "Makes a method private",
            "Converts a method to a class method"
          ],
          correctAnswer: "Creates a getter method"
        }
      ]
    }
  ],
  creator: new mongoose.Types.ObjectId("6876c09b8781b3ea002fc48b"),
  dateCreated: new Date(),
  isPublished: true
};


export const reactCourse = {
  title: "Mastering React.js: From Fundamentals to Advanced Patterns",
  description: "Learn to build modern, scalable web applications with React. Master hooks, context, state management, and performance optimization techniques.",
  category: "Web Development",
  imageUrl: "https://www.patterns.dev/img/reactjs/react-logo@3x.svg",

  topics: [
    {
      title: "React Fundamentals",
      skills: [
        {
          skillTitle: "Components and JSX",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Understanding React Components</h2>
              <p class="mb-4">React applications are built using components - reusable, isolated pieces of UI. There are two types of components:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// Class Component
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

// Function Component (modern approach)
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">JSX Deep Dive</h2>
              <p class="mb-4">JSX is a syntax extension that combines JavaScript with HTML-like tags:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>const element = (
  <div className="app">
    <h1>Hello World</h1>
    <p>Current time: {new Date().toLocaleTimeString()}</p>
  </div>
);</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Props and PropTypes</h2>
              <p class="mb-4">Props (properties) are how components receive data from their parent:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// Using props
function UserProfile({ name, age, email }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <p>Email: {email}</p>
    </div>
  );
}

// PropTypes (type checking)
import PropTypes from 'prop-types';

UserProfile.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  email: PropTypes.string
};</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Component Composition</h2>
              <p class="mb-4">React components can be composed together to build complex UIs:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>function App() {
  return (
    <Layout>
      <Header />
      <Sidebar>
        <NavMenu />
      </Sidebar>
      <MainContent>
        <Article />
        <Comments />
      </MainContent>
    </Layout>
  );
}</code></pre>
            </section>
          `
        },
        {
          skillTitle: "State and Lifecycle",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">Understanding State</h2>
              <p class="mb-4">State allows components to manage data that changes over time:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// Class component state
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }
  
  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };
}

// Functional component with useState hook
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  const increment = () => {
    setCount(prevCount => prevCount + 1);
  };</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Lifecycle Methods</h2>
              <p class="mb-4">Class components have lifecycle methods for different phases:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>class Example extends React.Component {
  componentDidMount() {
    // Runs after component mounts
    console.log('Component mounted');
  }
  
  componentDidUpdate() {
    // Runs after updates
    console.log('Component updated');
  }
  
  componentWillUnmount() {
    // Runs before unmounting
    console.log('Component will unmount');
  }
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">useEffect Hook</h2>
              <p class="mb-4">The useEffect hook combines all lifecycle functionality in functional components:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>import { useEffect } from 'react';

function Example() {
  useEffect(() => {
    // ComponentDidMount equivalent
    console.log('Component mounted');
    
    return () => {
      // ComponentWillUnmount equivalent
      console.log('Component will unmount');
    };
  }, []); // Empty array = run once on mount

  useEffect(() => {
    // Runs on mount AND when count changes
    console.log('Count changed:', count);
  }, [count]); // Dependency array
}</code></pre>
            </section>
          `
        }
      ],
      quiz: [
        {
          question: "What is the correct way to update state in a functional component?",
          options: [
            "this.setState({ count: 1 })",
            "setState({ count: 1 })",
            "setCount(1)",
            "state.count = 1"
          ],
          correctAnswer: "setCount(1)"
        },
        {
          question: "Which lifecycle method is equivalent to the empty dependency array in useEffect?",
          options: [
            "componentDidUpdate",
            "componentWillUnmount",
            "componentDidMount",
            "shouldComponentUpdate"
          ],
          correctAnswer: "componentDidMount"
        }
      ]
    },
    {
      title: "Advanced React Patterns",
      skills: [
        {
          skillTitle: "Context API and State Management",
          content: `
            <section class="skill-content">
              <h2 class="text-2xl font-bold mb-4">React Context API</h2>
              <p class="mb-4">Context provides a way to share values between components without prop drilling:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// 1. Create context
const ThemeContext = React.createContext('light');

// 2. Provide context value
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

// 3. Consume context
function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>Current theme: {theme}</div>;
}</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">Redux Fundamentals</h2>
              <p class="mb-4">Redux is a predictable state container for JavaScript apps:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>// Redux store setup
import { createStore } from 'redux';

function counterReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case 'increment':
      return { value: state.value + 1 };
    default:
      return state;
  }
}

const store = createStore(counterReducer);</code></pre>
              
              <h2 class="text-2xl font-bold mb-4 mt-8">React-Redux Integration</h2>
              <p class="mb-4">Connecting React components to Redux:</p>
              
              <pre class="bg-gray-100 p-4 rounded mb-4"><code>import { Provider, useSelector, useDispatch } from 'react-redux';

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}

function Counter() {
  const count = useSelector(state => state.value);
  const dispatch = useDispatch();
  
  return (
    <div>
      <button onClick={() => dispatch({ type: 'increment' })}>
        Count: {count}
      </button>
    </div>
  );
}</code></pre>
            </section>
          `
        }
      ],
      quiz: [
        {
          question: "What problem does Context API solve?",
          options: [
            "Component styling",
            "Prop drilling",
            "State immutability",
            "Server-side rendering"
          ],
          correctAnswer: "Prop drilling"
        },
        {
          question: "Which Redux function triggers state changes?",
          options: [
            "getState",
            "dispatch",
            "subscribe",
            "connect"
          ],
          correctAnswer: "dispatch"
        }
      ]
    }
  ],
  creator: new mongoose.Types.ObjectId("6876c09b8781b3ea002fc48b"),
  dateCreated: new Date(),
  isPublished: true
};