# PDF Splitter Pro

PDF Splitter Pro is a fast and intuitive client-side web application that lets you easily manage and process your PDF documents. The app allows you to upload multiple PDFs simultaneously, set custom page ranges to extract from each file, and either download them individually in a ZIP file or seamlessly merge the extracted pages into a single new PDF document. 

All processing is done locally in your browser using JavaScript, ensuring maximum privacy and security for your files since nothing is ever sent to a server.

## Features
- **Batch Processing**: Upload and process multiple PDF files at once with an intuitive drag-and-drop interface.
- **Custom Page Ranges**: Select exactly which pages you want to extract from each individual document.
- **Global Settings**: Apply a default page extraction range to all uploaded files simultaneously to save time.
- **Merge Option**: Optionally merge the extracted pages from all uploaded documents into one single PDF file.
- **Privacy First**: Everything happens locally within your browser. No files are ever uploaded to a server.
- **Bulk Actions**: Easily manage your queue with bulk actions like the "Delete All" button.

## Getting Started

Follow these step-by-step instructions to get the application running on your local machine.

### Prerequisites

Ensure you have the following installed on your computer:
- **Node.js**: [Download and install Node.js](https://nodejs.org/) (Version 18 or higher is recommended)
- **Git** (optional, for cloning the repository): [Download and install Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   Open your terminal (or command prompt) and run the following command to clone the project to your local machine:
   ```bash
   git clone https://github.com/Dwibiyanto117/pdf-splitter.git
   ```
   *(If you downloaded the code as a ZIP file instead, extract it and open your terminal in the extracted folder).*

2. **Navigate to the project directory**
   ```bash
   cd pdf-splitter
   ```
   *(Note: if your folder is named differently locally, use that folder name)*

3. **Install dependencies**
   Run the following command to download and install all the necessary packages required to run the app:
   ```bash
   npm install
   ```

4. **Start the development server**
   Once the installation is complete, start the app locally by running:
   ```bash
   npm run dev
   ```

5. **Open the app in your browser**
   After running the command above, your terminal will display a local address (usually `http://localhost:5173`). Open that link in your web browser to start using the app!

## Technologies Used
- React 18 (with TypeScript)
- Vite (Build Tool & Dev Server)
- pdf-lib (for parsing, splitting, and merging PDFs client-side)
- jszip & file-saver (for generating and downloading ZIP archives)
- Lucide React (for modern UI icons)
