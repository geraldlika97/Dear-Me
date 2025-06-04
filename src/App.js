import React, { useState, useEffect } from "react";
import { Picker } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";
import { db, storage } from "./firebase";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./App.css";

const App = () => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [anonymous, setAnonymous] = useState(false);
  const [posts, setPosts] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Simulazione login
  const handleLogin = () => {
    if (username === "utente1" && password === "password123") {
      setIsLoggedIn(true);
    } else {
      alert("Credenziali errate. Usa: utente1 / password123");
    }
  };

  // Carica i post
  useEffect(() => {
    if (isLoggedIn) {
      const fetchPosts = async () => {
        const querySnapshot = await getDocs(collection(db, "posts"));
        setPosts(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      };
      fetchPosts();
    }
  }, [isLoggedIn]);

  // Gestione upload immagine
  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
  };

  // Aggiungi emoji
  const addEmoji = (emoji) => {
    setContent(content + emoji.native);
    setShowEmojiPicker(false);
  };

  // Pubblica post
  const publishPost = async () => {
    if (!content || !isLoggedIn) return;
    let imageUrl = "";
    if (image) {
      const imageRef = ref(storage, `images/${image.name}`);
      await uploadBytes(imageRef, image);
      imageUrl = await getDownloadURL(imageRef);
    }
    await addDoc(collection(db, "posts"), {
      content,
      imageUrl,
      anonymous,
      reactions: { ti_capisco: 0, un_abbraccio: 0, sono_daccordo: 0 },
      createdAt: new Date().toISOString(),
      userId: "utente1",
    });
    setContent("");
    setImage(null);
    setAnonymous(false);
    const querySnapshot = await getDocs(collection(db, "posts"));
    setPosts(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  // Aggiungi reazione
  const addReaction = async (postId, reactionType) => {
    const postRef = doc(db, "posts", postId);
    const post = posts.find((p) => p.id === postId);
    const updatedReactions = {
      ...post.reactions,
      [reactionType]: post.reactions[reactionType] + 1,
    };
    await updateDoc(postRef, { reactions: updatedReactions });
    const querySnapshot = await getDocs(collection(db, "posts"));
    setPosts(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  if (!isLoggedIn) {
    return (
      <div className="login min-h-screen p-4 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-soul-dark mb-4">Accedi a DearMe</h2>
          <input
            type="text"
            placeholder="Username"
            className="w-full p-2 mb-4 border border-soul-gray rounded-md"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 mb-4 border border-soul-gray rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="bg-soul-button text-white px-4 py-2 rounded-md hover:bg-soul-dark w-full"
            onClick={handleLogin}
          >
            Accedi
          </button>
          <p className="text-soul-dark mt-2">Usa: <strong>utente1 / password123</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="app p-4">
      <div className="editor bg-white p-6 rounded-lg shadow-md mb-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-soul-dark mb-4">Scrivi su DearMe</h2>
        <textarea
          className="w-full h-40 p-2 border border-soul-gray rounded-md mb-4 font-sans"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Cosa vuoi scrivere oggi?"
        />
        <input
          type="file"
          accept="image/*"
          className="mb-4"
          onChange={handleImageUpload}
        />
        <div className="flex space-x-2 mb-4">
          <button
            className="bg-soul-button text-white px-4 py-2 rounded-md hover:bg-soul-dark"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            Aggiungi Emoji
          </button>
          {showEmojiPicker && <Picker onSelect={addEmoji} />}
        </div>
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="mr-2"
          />
          <span className="text-soul-dark">Pubblica come anonimo</span>
        </label>
        <button
          className="bg-soul-button text-white px-4 py-2 rounded-md hover:bg-soul-dark"
          onClick={publishPost}
        >
          Pubblica
        </button>
      </div>
      <div className="feed max-w-2xl mx-auto">
        {posts.map((post) => (
          <div
            key={post.id}
            className="post bg-white p-4 mb-4 rounded-lg shadow-md border border-soul-gray"
          >
            <p className="text-soul-dark mb-2">{post.content}</p>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post"
                className="max-w-full h-auto rounded-md mb-2"
              />
            )}
            <p className="text-sm text-soul-dark">
              {post.anonymous ? "Anonimo" : "Utente"} -{" "}
              {new Date(post.createdAt).toLocaleDateString("it-IT")}
            </p>
            <div className="reactions flex space-x-2 mt-2">
              <button
                className="bg-soul-gray text-soul-dark px-3 py-1 rounded-md hover:bg-soul-button hover:text-white"
                onClick={() => addReaction(post.id, "ti_capisco")}
              >
                Ti capisco ({post.reactions.ti_capisco})
              </button>
              <button
                className="bg-soul-gray text-soul-dark px-3 py-1 rounded-md hover:bg-soul-button hover:text-white"
                onClick={() => addReaction(post.id, "un_abbraccio")}
              >
                Un abbraccio ({post.reactions.un_abbraccio})
              </button>
              <button
                className="bg-soul-gray text-soul-dark px-3 py-1 rounded-md hover:bg-soul-button hover:text-white"
                onClick={() => addReaction(post.id, "sono_daccordo")}
              >
                Sono d'accordo ({post.reactions.sono_daccordo})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
