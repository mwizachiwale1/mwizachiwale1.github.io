const Navbar = () => {
  return ( 
    <nav className="navbar">
      <h1>The Dojo Blog</h1>
      <div className="links">
        <a href="/">Home</a>
        <a href="/create" style={{
          color: "#fff",
          backgroundColor: '#f1356d',
          borderRadius: '8px',
          padding: '10px'
        }}>New Blog</a>
      </div>
    </nav>
   );
}
 
export default Navbar;