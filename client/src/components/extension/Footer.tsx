export default function Footer() {
  return (
    <footer className="bg-neutral-light mt-auto p-4 text-xs text-neutral-dark border-t">
      <div className="flex justify-between items-center">
        <div>
          <p>WebExtension Dashboard v3.0.1</p>
          <p>Manifest V3 Compatible</p>
        </div>
        <div className="flex items-center space-x-3">
          <a href="#" className="hover:text-primary">Docs</a>
          <a href="#" className="hover:text-primary">Support</a>
          <a href="#" className="hover:text-primary">Feedback</a>
        </div>
      </div>
    </footer>
  );
}
