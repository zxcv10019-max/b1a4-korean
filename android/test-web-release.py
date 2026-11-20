from pathlib import Path
import hashlib, importlib.util, json, tempfile, unittest, zipfile
ROOT=Path(__file__).resolve().parent
TEST_TEMP=ROOT/'test-temp';TEST_TEMP.mkdir(exist_ok=True)
assert TEST_TEMP.resolve().parent==ROOT.resolve()
spec=importlib.util.spec_from_file_location('release',ROOT/'make-web-release.py')
release=importlib.util.module_from_spec(spec);spec.loader.exec_module(release)

class ReleaseTests(unittest.TestCase):
    def test_manifest_matches_exact_bundle_and_excludes_native_control(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as temp:
            root=Path(temp);assets=root/'assets';assets.mkdir()
            (assets/'index.html').write_text('<!DOCTYPE html>'+('頁面'*1000),encoding='utf-8')
            (assets/'bana-updates.js').write_text('native control',encoding='utf-8')
            (assets/'updates-config.json').write_text('{}',encoding='utf-8')
            (assets/'vendor').mkdir();(assets/'vendor'/'library.js').write_text('test',encoding='utf-8')
            m=release.create_release(assets,root/'out',2,'2026.11.21.1','更新排版')
            raw=(root/'out'/m['bundleUrl']).read_bytes()
            self.assertEqual(m['sha256'],hashlib.sha256(raw).hexdigest());self.assertEqual(m['bytes'],len(raw))
            self.assertEqual(json.loads((root/'out'/'latest.json').read_text(encoding='utf-8')),m)
            with zipfile.ZipFile(root/'out'/m['bundleUrl']) as z:self.assertEqual(set(z.namelist()),{'index.html','vendor/library.js'})
    def test_invalid_versions_and_output_location_rejected(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as temp:
            root=Path(temp);assets=root/'assets';assets.mkdir();(assets/'index.html').write_text('x'*1200)
            for code in [0,-1,True,1.5]:
                with self.assertRaises(ValueError):release.create_release(assets,root/'out',code,'version')
            with self.assertRaises(ValueError):release.create_release(assets,assets/'dist',2,'version')
            with self.assertRaises(ValueError):release.create_release(assets,root/'out',2,'version',minimum_shell=57)
    def test_native_binary_rejected(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as temp:
            root=Path(temp);assets=root/'assets';assets.mkdir();(assets/'index.html').write_text('x'*1200);(assets/'classes.dex').write_bytes(b'unsafe')
            with self.assertRaises(ValueError):release.create_release(assets,root/'out',2,'version')

if __name__=='__main__':unittest.main()
