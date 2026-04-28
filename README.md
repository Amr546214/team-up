
# TeamUP <a href="https://team-up-one-pink.vercel.app" target="_blank"> <img src="./src/assets/logo/teamup-logo.png" alt="TeamUP" width="30" height="30" style="vertical-align: middle;" title="TeamUP" > </a>Welcome to **TeamUP**. <br>A modern collaboration and events platform built to connect users, developers, companies, events, and opportunities in one interactive experience.## Live PreviewThe project is currently under deployment, and the first public preview page is live:🔗 **[TeamUP Preview](https://team-up-one-pink.vercel.app)**## Overview**TeamUP** is a React-based platform designed to make collaboration, events, and opportunities easier to discover and access.The platform includes multiple user flows such as:- Clients- Developers- Companies- AdminsIt also includes interactive features like authentication, event discovery, profile management, quiz-based ranking, notifications, map-based event browsing, and an AI chatbot experience.## Tech Stack| Technology | Usage || ---------- | ----- || **React** | Frontend user interface || **Vite** | Development server and build tool || **Tailwind CSS** | Styling and responsive design || **React Router** | Client-side routing || **Framer Motion** | Animations and UI transitions || **Supabase** | Chat memory and backend storage || **n8n** | Chatbot workflow automation || **Vercel** | Deployment and public preview hosting |## Project Structure```bashsrc/├── assets/              # Images, logos, icons, and static assets├── components/          # Reusable UI components├── pages/               # Application pages│   ├── public/          # Public pages such as DeploymentPage│   └── auth/            # Authentication-related pages├── routes/              # Main application routing├── hooks/               # Custom React hooks├── context/             # Global state and providers├── utils/               # Helper functions and utilities└── styles/              # Global styles if available
Main Features
Authentication Flow
TeamUP supports multiple user roles:


Client


Developer


Company


Admin


The authentication flow controls user access and shows role-based routes and UI.
Events Experience
The platform includes an interactive events experience with:


Event list view


Event details view


Map-based event browsing


Responsive mobile layout


Registered users count


Event images and metadata


User Profiles
Users can manage profile-related data such as:


Avatar / profile image


Skills


Experience


Track


Portfolio


Quiz rank and score


Profile images are stored and reused across avatar components using local storage.
Chatbot
TeamUP includes a floating chatbot widget with:


Fixed bottom-right button


Right-side chat sidebar


Mock messages


User and assistant avatars


Coming-soon locked state


Countdown timer


Supabase memory support through n8n workflow


Deployment Page
The production deployment currently shows a temporary landing page:


Under Deployment status


TeamUP branding


Countdown to launch


Responsive design


Chatbot support on production preview


Getting Started
Prerequisites
Make sure you have the following installed:
node -vnpm -vgit --version
Recommended:
Node.js 18+npm 9+
Installation
Clone the repository:
git clone https://github.com/Amr546214/team-up.git
Go to the project folder:
cd team-up
Install dependencies:
npm install
Start the development server:
npm run dev
The app will usually run on:
http://localhost:5173
Command Reference
Development
npm run dev
Starts the local development server with Vite.
Build
npm run build
Builds the project for production.
Preview Production Build
npm run preview
Runs a local preview of the production build.
Lint
npm run lint
Runs ESLint checks if configured in the project.
Deployment
The project is deployed using Vercel.
Current preview:
https://team-up-one-pink.vercel.app
Deployment flow:
git add .git commit -m "update project"git push
After pushing to the main branch, Vercel automatically creates a new deployment.
Environment Notes
For local development:
npm run dev
For production on Vercel:


The public deployment page is shown.


The chatbot can still be displayed on the deployment page.


The original app routes remain available for local development.


Chatbot Memory Flow
The chatbot memory workflow uses:
Frontend → n8n Webhook → Supabase → OpenAI → Supabase → Frontend
Memory is stored in Supabase table:
chat_memory
Main columns:
ColumnDescriptionsession_idIdentifies each user/sessionroleMessage role: user, assistant, or systemcontentMessage textcreated_atMessage timestamp
Contributing
When working on the project:


Create or switch to your working branch.


Make your changes.


Test locally.


Commit with a clear message.


Push to GitHub.


Deploy through Vercel automatically.


Example:
git add .git commit -m "improve chatbot UI"git push
Roadmap
Planned improvements:


Complete production deployment


Connect chatbot frontend to n8n webhook


Improve authentication persistence


Finalize user role dashboards


Add real event registration data


Improve responsive layouts


Add production-ready database integration


Launch full TeamUP experience


License
This project is currently private/internal for graduation project development.
TeamUP
Built with passion to make collaboration, opportunities, and events more connected.
بعد ما تحطه في `README.md` اعمل:```bashgit add README.mdgit commit -m "update README"git push
