import OpenAI from 'openai';
import User from '../models/User.js';
import FeedbackRoom from '../models/FeedbackRoom.js';
import Course from '../models/Course.js';
import axios from 'axios';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://localhost:3000",
    "X-Title": "ByteLearn"
  }
});



const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const getUnsplashImage = async (query, fallbackUrl) => {
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,
        per_page: 1,
        client_id: UNSPLASH_ACCESS_KEY
      }
    });    
    
    if (response.data.results.length > 0) {
      return response.data.results[0].urls.regular;
    }
    return fallbackUrl;
  } catch (error) {
    console.error("Unsplash API error:", error.message);
    return fallbackUrl;
  }
};


export const handler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!req.user.userId) return res.status(401).send({ success: false, msg: "Unauthorized Access" })

  try {
    const { promptCourseName, promptCourseDescription, promptCategory } = req.data;

    const completion = await openai.chat.completions.create({
  
      
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert course creation assistant that outputs PURE RAW JSON (NO MARKDOWN WRAPPING) matching this schema...
    
    REQUIRED COURSE STRUCTURE (MAKE SURE THIS STRUCTURE IS FOLLOWED):
    { 
      title: string,
      description: string,
      category: string,
      imageUrl: string,
      topics: [
        {
          title: string,
          skills: [
            {
              skillTitle: string,
              content: string (HTML-formatted with beautiful styling)
            }
          ],
          quiz: [  
            {
              question: string,
              options: string[4],
              correctAnswer: string
            }
          ]
        }
      ]
    }

    INSTRUCTIONS:
    1. Generate 3-4 comprehensive topics
    2. Each topic must have 4 professional skills
    3. Each topic must have at least 8 quality quiz question
    4. Skill content must use HTML/CSS for beautiful formatting
    5. Use realistic placeholder images from unsplash.com
    6. Omit fields not listed above
    7. Ensure valid JSON output
    8. Make sure each skill's content is as much and as robust as this:<section class="skill-content">
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
            9. Structure content with:
            - Theory explanation
            - Real-world application
            - Code example (if technical)
            -  MAKE SURE THE SKILL CONTENT LINES ARE 150 LINES OR MORE NOTHING LESS
          🚀 IMAGE GENERATION RULES (100% WORKING OR BUST):
          10. PROPERLY ESCAPE ALL SPECIAL CHARACTERS IN HTML CONTENT",
11. Replace all double quotes in HTML attributes with single quotes",
12. Validate JSON with JSONLint before responding
13. OUTPUT MUST BE VALID JSON ONLY - NO EXTRA TEXT OR COMMENTS",
14. USE DOUBLE QUOTES FOR ALL PROPERTIES AND STRINGS",
15. ESCAPE ALL SPECIAL CHARACTERS IN HTML CONTENT",
16. NEVER USE SINGLE QUOTES FOR JSON PROPERTIES",
17. VALIDATE YOUR OUTPUT WITH JSONLINT BEFORE RESPONDING
18. NEVER TRUNCATE JSON OUTPUT - ENSURE FULL STRUCTURE IS COMPLETE",
19. COUNT ALL OPEN BRACES AND ARRAYS BEFORE RESPONDING",
20. IF CONTENT IS LONG, PRIORIZE COMPLETE JSON OVER CONTENT LENGTH",
21. VALIDATE YOUR OUTPUT HAS:\n" +
   - MATCHING {} FOR ALL OBJECTS\n" +
   - MATCHING [] FOR ALL ARRAYS\n" +
   - ALL STRINGS PROPERLY CLOSED
1. **SOURCE**: Only use:
   - Unsplash (https://images.unsplash.com/photo-*)
   - Pexels (https://images.pexels.com/photos/*)    
   - Direct image URLs (no placeholders)

2. **FORMAT**: Must be:
   - High-res (min 800x600)
   - No watermarks
   - Relevant to course topic

3. **KEYWORDS**: Pull from course title & category:
   - "${promptCourseName}"
   - "${promptCategory}"

4. **FALLBACK**: If unsure, use:
   "https://images.unsplash.com/photo-1546410531-bb4caa6b424d" (education fallback)

5. **VALIDATION**: Before responding:
   - Visually imagine the image
   - Ensure URL follows exact patterns above
   - NEVER repeat previous images`
        },
        {
          role: "user",
          content: `Create a course with these details:
    - Course Name: ${promptCourseName}
    - Course Description: ${promptCourseDescription}
    - Category: ${promptCategory}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });



    // First try to parse as pure JSON
    let generatedContent;
    try {
      let content = completion.choices[0].message.content;
      
      // Remove Markdown wrapper if present
      if (content.startsWith('```')) {
        content = content.replace(/^```(json)?|```$/g, '').trim();
      }

      generatedContent = JSON.parse(content);
    } catch (error) {
      console.error("JSON parse error:", error);
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    // Validate and replace image URL
    const imageSearchQuery = `${generatedContent.title} ${generatedContent.category}`;
    generatedContent.imageUrl = await getUnsplashImage(
      imageSearchQuery,
      "https://images.unsplash.com/photo-1546410531-bb4caa6b424d" // Fallback
    );

    // Validate other required fields
    if (!generatedContent.title || !generatedContent.description || !generatedContent.topics) {
      throw new Error("AI response missing required fields");
    }
    
    console.log("RAW API RESPONSE:", generatedContent)
    const exsistingUser = await User.findById(req.user.userId);

    // 2. Create the course in database
    const newCourse = await Course.create({
      title: generatedContent.title,
      description: generatedContent.description,
      category: generatedContent.category,
      imageUrl: generatedContent.imageUrl,
      topics: generatedContent.topics,
      creator: exsistingUser._id
    });

    // 3. Create feedback room for the course
    const feedbackRoom = await FeedbackRoom.create({
      course: newCourse._id
    });

    // 4. Update course with feedback room reference
    await Course.findByIdAndUpdate(newCourse._id, {
      feedbackRoom: feedbackRoom._id
    });


    // 5. Update user's created courses
    const updatedUser = await User.findByIdAndUpdate(
      exsistingUser._id,
      { $push: { createdCourses: newCourse._id } },
      { new: true }
    ).populate({
      path: "createdCourses",
      select: "_id title description category imageUrl topics dateCreated likes feedbackRoom",
      populate: [
        {
          path: "creator",
          select: "fullName avatar email"
        },
        {
          path: "feedbackRoom",
          populate: {
            path: "messages",
            options: { sort: { createdAt: -1 } },
            populate: {
              path: "sender",
              select: "fullName avatar"
            }
          }
        }
      ]
    });

    // Check liked courses
    let likedCoursesSet = new Set();
    if (req.user.userId) {
      const user = await User.findById(req.user.userId).select("likedCourses");
      likedCoursesSet = new Set(user?.likedCourses?.map(id => id.toString()));
    }

    // Format response
    const formattedCourses = updatedUser.createdCourses.map(course => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      imageUrl: course.imageUrl,
      likes: course.likes || 0,
      topics: course.topics,
      dateCreated: course.dateCreated,
      likedByCurrentUser: likedCoursesSet.has(course._id.toString()),
      creator: {
        fullName: course.creator?.fullName,
        email: course.creator?.email,
        profilePicture: course.creator?.avatar
      },
      feedbackMessages: course.feedbackRoom?.messages?.map(msg => ({
        _id: msg._id,
        sender: {
          fullName: msg.sender?.fullName,
          profilePicture: msg.sender?.avatar
        },
        text: msg.content,
        createdAt: msg.createdAt
      }))
    }));

    res.status(201).json({
      success: true,
      course: {
        ...newCourse.toObject(),
        creator: {
          fullName: exsistingUser.fullName,
          email: exsistingUser.email,
          profilePicture: exsistingUser.avatar
        }
      },
      newCreatedCoursesList: formattedCourses,
      feedbackRoomId: feedbackRoom._id
    });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({
      error: "Failed to generate course",
      details: error.message
    });
  }
};

