🌊 AquaBase
An AI-powered web platform that transforms scattered fish catch data into an interactive, visual database for marine research.

HOSA10: Integrated Fish Catch Data Repository
Challenge
Scientific data on fish catch is scattered and disorganized, wasting valuable time and hindering critical research. A unified, searchable database is needed to enable the development of more accurate species-specific advisories.

Our Mission
To build a user-friendly, web-based data repository that can ingest simulated disaggregated data and provide scientists with a streamlined way to filter, visualize, and download it.

✨ Features
Data Ingestion Portal: A simple web page that can accept simulated fish catch data in Excel/CSV format. The system automatically parses the data and categorizes it by species, location, and date.

Advanced Filtering and Search: A robust search and filtering system on the front-end that allows a user to query the data based on multiple parameters, such as a specific species, a geographical area (using latitude/longitude ranges), or a time period.

Data Visualization and Download: The system visualizes the search results using simple charts (e.g., a bar chart showing abundance) and a map. It also allows the user to download the filtered data in a clean, standardized format.

User Authentication: A login system to control data access and provide an admin page for uploading new data.

Heatmaps: A simple map that shows "heatmaps" of a species' abundance in a given area.

Relevant SDGs
SDG 14: Life Below Water - By making fish catch data more accessible, the project enables better scientific research for sustainable fisheries management and ocean conservation.

SDG 9: Industry, Innovation, and Infrastructure - The system represents a crucial piece of digital infrastructure for scientific research, fostering innovation and data-driven policy in marine biology.

🛠️ Tech Stack
Frontend
Framework: React

Build Tool: Vite

Language: TypeScript

Styling: Tailwind CSS

UI Components: Shadcn UI / Radix UI

Data Fetching: TanStack Query

Charting: Chart.js & Recharts

Mapping: Leaflet.js & React Leaflet

Backend & Database
Backend-as-a-Service: Supabase

Database: Supabase (PostgreSQL + PostGIS)

Authentication: Supabase Auth
