#!/usr/bin/env python3
"""
ThaalTatva AI - Automated Android APK Compiler & Signer
Builds, dexes, packages, and signs the native Android APK using aapt2, d8, and ApkSigner.
"""

import os
import sys
import subprocess
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
TOOLCHAIN = '/home/subhadip/.gemini/antigravity-ide/brain/0c01ed7d-234c-47bb-a955-302b7d07fd4a/scratch/toolchain'
AAPT2 = f'{TOOLCHAIN}/aapt2'
ECJ = f'{TOOLCHAIN}/ecj.jar'
R8 = f'{TOOLCHAIN}/r8.jar'
APKSIG = f'{TOOLCHAIN}/apksig.jar'
ANDROID_JAR = f'{TOOLCHAIN}/android.jar'

def build():
    print("==================================================")
    print("  🇮🇳 THAALTATVA AI - ANDROID APK BUILD ENGINE")
    print("==================================================")

    # 1. Sync static assets to android assets
    print("==> [1/6] Syncing latest static assets to android assets...")
    assets_dir = f'{ROOT}/android/app/src/main/assets'
    os.makedirs(assets_dir, exist_ok=True)
    shutil.copytree(f'{ROOT}/static', assets_dir, dirs_exist_ok=True)

    # 2. Compile resources
    print("==> [2/6] Compiling Android resources with aapt2...")
    res_dir = f'{ROOT}/android/app/src/main/res'
    compiled_res = f'{ROOT}/android/compiled_res.zip'
    if os.path.exists(compiled_res):
        os.remove(compiled_res)
    subprocess.check_call([AAPT2, 'compile', '--dir', res_dir, '-o', compiled_res])

    # 3. Link APK & generate R.java
    print("==> [3/6] Linking Android manifest and resources...")
    gen_dir = f'{ROOT}/android/app/src/main/gen'
    shutil.rmtree(gen_dir, ignore_errors=True)
    os.makedirs(gen_dir, exist_ok=True)
    manifest = f'{ROOT}/android/app/src/main/AndroidManifest.xml'
    base_apk = f'{ROOT}/android/app-unaligned.apk'
    if os.path.exists(base_apk):
        os.remove(base_apk)

    subprocess.check_call([
        AAPT2, 'link',
        '-I', ANDROID_JAR,
        '--manifest', manifest,
        '-o', base_apk,
        '--java', gen_dir,
        compiled_res
    ])

    # 4. Compile Java sources
    print("==> [4/6] Compiling Java code with ECJ compiler...")
    bin_dir = f'{ROOT}/android/bin'
    shutil.rmtree(bin_dir, ignore_errors=True)
    os.makedirs(bin_dir, exist_ok=True)

    java_files = []
    for d in [gen_dir, f'{ROOT}/android/app/src/main/java']:
        for root, _, files in os.walk(d):
            for f in files:
                if f.endswith('.java'):
                    java_files.append(os.path.join(root, f))

    cmd = ['java', '-jar', ECJ, '-1.8', '-cp', ANDROID_JAR, '-d', bin_dir] + java_files
    subprocess.check_call(cmd)

    # 5. D8 Dexing
    print("==> [5/6] Dexing bytecode into classes.dex with D8...")
    dex_dir = f'{ROOT}/android/dex'
    shutil.rmtree(dex_dir, ignore_errors=True)
    os.makedirs(dex_dir, exist_ok=True)

    class_files = []
    for root, _, files in os.walk(bin_dir):
        for f in files:
            if f.endswith('.class'):
                class_files.append(os.path.join(root, f))

    cmd = ['java', '-cp', R8, 'com.android.tools.r8.D8', '--min-api', '21', '--lib', ANDROID_JAR, '--output', dex_dir] + class_files
    subprocess.check_call(cmd)
    classes_dex = f'{dex_dir}/classes.dex'

    # Packaging
    subprocess.check_call(['zip', '-j', '-u', base_apk, classes_dex])
    orig_cwd = os.getcwd()
    os.chdir(f'{ROOT}/android/app/src/main')
    subprocess.check_call(['zip', '-u', '-r', base_apk, 'assets'])
    os.chdir(orig_cwd)

    # 6. Signing
    print("==> [6/6] Signing APK with Google ApkSigner (v1 + v2 scheme)...")
    keystore_path = f'{ROOT}/android/thaaltatva-release.keystore'
    os.makedirs(f'{ROOT}/release', exist_ok=True)
    final_apk = f'{ROOT}/release/ThaalTatva-v1.0.0-release.apk'
    root_apk = f'{ROOT}/ThaalTatva.apk'

    subprocess.check_call([
        'java', '-cp', f'{TOOLCHAIN}:{APKSIG}', 'Signer',
        base_apk, final_apk, keystore_path, 'thaaltatva', 'thaaltatva123'
    ])

    shutil.copyfile(final_apk, root_apk)

    size_mb = os.path.getsize(final_apk) / (1024 * 1024)
    print("\n" + "="*50)
    print("🎉 SUCCESS! ANDROID APK READY FOR RELEASE")
    print(f"📦 Release APK : {final_apk}")
    print(f"📦 Direct Link  : {root_apk}")
    print(f"⚖️ File Size    : {size_mb:.2f} MB")
    print("🇮🇳 Logo: Indian Tricolor Flag (Saffron, White Chakra, Green)")
    print("⚡ Features: Realtime Camera CV + GPS Gym Radar")
    print("="*50 + "\n")

if __name__ == '__main__':
    build()
