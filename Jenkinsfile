pipeline {
    // Pipeline-level agent (each stage can override if needed)/modified 1
    agent {
        docker {
            image 'node:14'  // Use a Node.js image
            args '-p 3000:80' // Map the app's port to host
        }
    }

    stages {
        stage('Build Angular') {
            steps {
                echo "Installing dependencies and building Angular..."
                sh 'npm install'
                sh 'npm run build --prod'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                sh 'docker build -t angular-app .'
                sh 'docker images'
            }
        }

        stage('Deploy Docker Container') {
            steps {
                echo "Deploying Docker container..."
                sh '''
                docker stop angular-app || true
                docker rm angular-app || true
                docker run -d -p 8080:80 --name angular-app angular-app
                '''
            }
        }
    } // end stages
} // end pipeline
