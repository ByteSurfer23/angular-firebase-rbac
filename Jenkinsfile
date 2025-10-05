pipeline {
    agent none  // no default agent, each stage specifies its agent , added modifications

    stages {
        stage('Build Angular') {
            agent { label 'node-agent' } // dynamic agent with Node.js
            steps {
                echo "Installing dependencies and building Angular..."
                sh 'npm install'
                sh 'npm run build --prod'
            }
        }

        stage('Build Docker Image') {
            agent { label 'docker-agent' } // dynamic agent with Docker
            steps {
                echo "Building Docker image..."
                sh 'docker build -t angular-app .'
                sh 'docker images'
            }
        }

        stage('Deploy Docker Container') {
            agent { label 'docker-agent' } // dynamic agent with Docker
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

    triggers {
        pollSCM('H/5 * * * *') // optional: checks GitHub every 5 minutes
    }
}
