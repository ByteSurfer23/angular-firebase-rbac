pipeline {
    agent none  // no default agent, each stage specifies its agent , added modifications , more modifications , more modifications

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
    }
}
