pipeline {
  agent {
    label "jenkins-nodejs"
  }
  environment {
    ORG = 'erosendale'
    APP_NAME = 'tag-match'
    CHARTMUSEUM_CREDS = credentials('jenkins-x-chartmuseum')
    DOCKER_REGISTRY_ORG = 'silicon-pattern-251401'
  }
  stages {
    stage('CI Build and push snapshot') {
      when {
        branch 'PR-*'
      }
      environment {
        PREVIEW_VERSION = "0.0.0-SNAPSHOT-$BRANCH_NAME-$BUILD_NUMBER"
        PREVIEW_NAMESPACE = "$APP_NAME-$BRANCH_NAME".toLowerCase()
        HELM_RELEASE = "$PREVIEW_NAMESPACE".toLowerCase()
      }
      steps {
        container('nodejs') {
          dir('local_stack/') {
            sh 'sh script/start.sh' 
          }
          dir('backend/') {
            sh "jx step credential -s npm-token -k file -f /builder/home/.npmrc --optional=true"
            sh "npm install"
            sh "CI=true DISPLAY=:99 npm test"
            sh "export VERSION=$PREVIEW_VERSION && skaffold build -f skaffold.yaml"
            sh "jx step post build --image $DOCKER_REGISTRY/$ORG/$APP_NAME:$PREVIEW_VERSION"
            dir('../charts/preview') {
              sh "make preview"
              sh "jx preview --app $APP_NAME --dir ../.."
            }
          }
          dir('local_stack/') {
            sh 'sh script/stop.sh'
          }
        }
      }
    }
    stage('Build Release') {
      when {
        branch 'master'
      }
      steps {
        container('nodejs') {
          dir('local_stack/') {
            sh 'sh script/start.sh' 
          }
          dir('backend/') {
            // ensure we're not on a detached head
            sh "git checkout master"
            sh "git config --global credential.helper store"
            sh "jx step git credentials"

            // so we can retrieve the version in later steps
            sh "echo \$(jx-release-version) > VERSION"
            sh "jx step tag --version \$(cat VERSION)"
            sh "jx step credential -s npm-token -k file -f /builder/home/.npmrc --optional=true"
            sh "npm install"
            sh "CI=true DISPLAY=:99 npm test"
            sh "export VERSION=`cat VERSION` && skaffold build -f skaffold.yaml"
            sh "jx step post build --image $DOCKER_REGISTRY/$ORG/$APP_NAME:\$(cat VERSION)"
          }
          dir('local_stack/') {
            sh 'sh script/stop.sh'
          }
        }
      }
    }
    stage('Promote to Environments') {
      when {
        branch 'master'
      }
      steps {
        container('nodejs') {
          dir('../charts/tag-match') {
            sh "jx step changelog --batch-mode --version v\$(cat ../../VERSION)"

            // release the helm chart
            sh "jx step helm release"

            // promote through all 'Auto' promotion Environments
            sh "jx promote -b --all-auto --timeout 1h --version \$(cat ../../VERSION)"
          }
        }
      }
    }
  }
  post {
        always {
          cleanWs()
        }
  }
}
