pipeline {
    agent {
        docker {
            image 'node:22.16.0'  // Use a specific Node.js version image
            args '-u 0 -p 3000:80' // Run as root user, map ports as needed
        }
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()  // Clean workspace fully before starting build to avoid stale files
            }
        }

        stage('Install Dependencies and Build Angular') {
            steps {
                echo "Installing dependencies and building Angular..."
                sh 'rm -rf node_modules package-lock.json'
                sh 'npm cache clean --force'  // Clean npm cache to avoid corrupted installations
                sh 'npm ci'                   // Clean install dependencies from lock file
                sh 'npm run build -- --prod'  // Build Angular with production flag, note the double --
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                sh 'docker build -t angular-app .'
                sh 'docker images angular-app'  // Show only relevant images for clarity
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
    }

    post {
        always {
            cleanWs()  // Clean workspace after build regardless of outcome
        }
    }
}
