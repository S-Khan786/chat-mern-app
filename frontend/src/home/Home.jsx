import { useAuth } from '../context/AuthContext.jsx';

function Home() {
    const { authUser } = useAuth(); 
  return (
    <div>
      Hi {authUser.email}
    </div>
  )
}

export default Home;
