function Footer() {
  return (
    <footer className="border-t border-gray-800 p-5 text-center text-muted-foreground text-sm">
      <p className="">
        &copy; {new Date().getFullYear()} Harvey: Data Room. This is not a real App.{' '}
        <em>Designed by Daniel Semirazov</em>.
      </p>
    </footer>
  )
}

export { Footer }
