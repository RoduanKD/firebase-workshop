// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js'

// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, signInWithPopup, onAuthStateChanged, signOut, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js'
import {
    addDoc,
    collection,
    doc, getDoc,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    Timestamp, updateDoc,
    where
} from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
// TODO: ADD YOUR FIREBASE CONFIG HERE
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

const whenSignedIn = document.getElementById('whenSignedIn')
const whenSignedOut = document.getElementById('whenSignedOut')

const signInBtn = document.getElementById('signInBtn')
const signOutBtn = document.getElementById('signOutBtn')

const userDetails = document.getElementById('userDetails')


// Authentication
const auth = getAuth(app)

// Google authentication
const provider = new GoogleAuthProvider()

// when signInBtn is clicked show the sign-in popup
signInBtn.onclick = async () => signInWithPopup(auth, provider)

signOutBtn.onclick = async () => signOut(auth)

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    const uid = user.uid

    userDetails.innerHTML = `<h3>Welcome ${user.displayName}!</h3> <p>User ID: ${uid}</p>`
    whenSignedIn.hidden = false
    whenSignedOut.hidden = true
  } else {
    // User is signed out

    whenSignedIn.hidden = true
    whenSignedOut.hidden = false
    userDetails.innerHTML = ''
  }
})

// Todo list
const todoList = document.getElementById('todoList')
const createTodoForm = document.getElementById('createTodoForm')
const todoTitleInput = document.getElementById('todoTitleInput')

let todoRef
let unsubscribe
const db = getFirestore(app)
const todoCollectionName = 'todos'

onAuthStateChanged(auth, async (user) => {

    if (user) {
        // Database Reference
        todoRef = collection(db, todoCollectionName)

        createTodoForm.onsubmit = (e) => {
            e.preventDefault()

            addDoc(todoRef, {
                uid: user.uid,
                title: todoTitleInput.value,
                isDone: false,
                createdAt: Timestamp.now(),
            })

            createTodoForm.reset()
        }


        const q = query(collection(db, todoCollectionName), where('uid', '==', user.uid), orderBy('createdAt'))
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            todoList.innerHTML = querySnapshot.docs.map(doc => `<li onclick="toggle('${doc.id}')">${ doc.data().title } - ${doc.data().isDone ? '✅' : '❌'}</li>`).join('\n')
        })

    } else {
        // Unsubscribe when the user signs out
        unsubscribe && unsubscribe()
        todoList.innerHTML = ''
    }
})

window.toggle = async (id) => {
    const todoDocRef = doc(db, todoCollectionName, id)

    try {
        const todoDoc = await getDoc(todoDocRef)

        if (todoDoc.exists()) {
            const currentData = todoDoc.data()

            await updateDoc(todoDocRef, {
                isDone: !currentData.isDone,
            })
        } else {
            console.error(`Document with ID ${id} does not exist.`)
        }
    } catch (error) {
        console.error("Error updating document:", error)
    }
}
