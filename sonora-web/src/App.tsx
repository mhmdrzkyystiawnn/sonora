import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/auth";
import { LibraryProvider } from "./context/library";
import { FollowProvider } from "./context/follow";
import { AudioPlayerProvider } from "./context/audio";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { MusicSearch } from "./pages/MusicSearch";
import { MusicDetail } from "./pages/MusicDetail";
import { ArtistSearch } from "./pages/ArtistSearch";
import { ArtistDetail } from "./pages/ArtistDetail";
import { Discovery } from "./pages/Discovery";
import { GenreBrowse } from "./pages/GenreBrowse";
import { GenreDetail } from "./pages/GenreDetail";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Library } from "./pages/Library";
import { PlaylistDetail } from "./pages/PlaylistDetail";
import { SharedPlaylist } from "./pages/SharedPlaylist";
import { Stats } from "./pages/Stats";

function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <FollowProvider>
          <AudioPlayerProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Navbar />
                <main className="flex-1 mx-auto w-full max-w-5xl px-6 sm:px-8">
                  <Routes>
                    <Route path="/" element={<Discovery />} />
                    <Route path="/genre" element={<GenreBrowse />} />
                    <Route path="/genre/:tag" element={<GenreDetail />} />
                    <Route path="/music" element={<MusicSearch />} />
                    <Route path="/music/:artist/:track" element={<MusicDetail />} />
                    <Route path="/artists" element={<ArtistSearch />} />
                    <Route path="/artist/:name" element={<ArtistDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/library"
                      element={
                        <ProtectedRoute>
                          <Library />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/playlist/:id"
                      element={
                        <ProtectedRoute>
                          <PlaylistDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/playlist/shared/:token" element={<SharedPlaylist />} />
                    <Route
                      path="/stats"
                      element={
                        <ProtectedRoute>
                          <Stats />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </AudioPlayerProvider>
        </FollowProvider>
      </LibraryProvider>
    </AuthProvider>
  );
}

export default App;