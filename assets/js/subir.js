function selectType(el) {
    document.querySelectorAll('.type-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}
function selectAccess(el) {
    document.querySelectorAll('.access-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}
function handleFile(input) {
    if (input.files[0]) {
        document.getElementById('file-label').textContent = '✓ ' + input.files[0].name;
        document.getElementById('dropzone').style.borderColor = 'var(--amber)';
    }
}
function addTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = e.target.value.trim();
        if (!val) return;
        const span = document.createElement('span');
        span.className = 'tag-removable';
        span.innerHTML = val + ' <button onclick="removeTag(this)">×</button>';
        document.getElementById('tags-container').insertBefore(span, e.target);
        e.target.value = '';
    }
}
function removeTag(btn) { btn.parentElement.remove(); }
document.getElementById('f-resumen').addEventListener('input', function () {
    document.getElementById('char-count').textContent = this.value.length + ' / 500';
});
const dz = document.getElementById('dropzone');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); });
function submitForm() {
    document.getElementById('success-overlay').classList.add('show');
}
function resetForm() {
    document.getElementById('success-overlay').classList.remove('show');
    document.getElementById('f-titulo').value = '';
    document.getElementById('file-label').textContent = 'Formatos aceptados PDF · DOCX · Máx. 50 MB';
    document.getElementById('dropzone').style.borderColor = '';
}