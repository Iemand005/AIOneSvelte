use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn main() {
    tauri_build::build();

    let manifest_dir =
        PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR is set"));
    let out_dir = PathBuf::from(env::var("OUT_DIR").expect("OUT_DIR is set"));
    let profile = env::var("PROFILE").unwrap_or_else(|_| String::from("debug"));
    let config = if profile == "release" {
        "Release"
    } else {
        "Debug"
    };

    println!("cargo:rerun-if-env-changed=AIONE_DIR");
    println!("cargo:rerun-if-env-changed=AIONE_LIB_DIR");

    if let Some(prefix) = env::var_os("AIONE_LIB_DIR").map(PathBuf::from) {
        link_prebuilt(&prefix, &out_dir);
        return;
    }

    let aione_dir = find_aione_dir(&manifest_dir).expect(
        "Could not find the AIOne sources. Set AIONE_DIR or point AIONE_LIB_DIR at an AIOne install.",
    );

    println!(
        "cargo:rerun-if-changed={}",
        aione_dir.join("CMakeLists.txt").display()
    );
    println!(
        "cargo:rerun-if-changed={}",
        aione_dir.join("include").display()
    );
    println!("cargo:rerun-if-changed={}", aione_dir.join("src").display());

    let build_dir = out_dir.join("aione-build");
    let install_dir = out_dir.join("aione-install");

    let mut configure = Command::new("cmake");
    configure
        .arg("-S")
        .arg(&aione_dir)
        .arg("-B")
        .arg(&build_dir)
        .arg(format!("-DCMAKE_BUILD_TYPE={config}"))
        .arg(format!("-DCMAKE_INSTALL_PREFIX={}", install_dir.display()))
        .arg("-DAIONE_BUILD_SHARED_LIBS=ON")
        .arg("-DAIONE_DEPS_SHARED=OFF")
        .arg("-DAIONE_UWP=OFF")
        .arg("-DAIONE_ENABLE_OPENAI=OFF")
        .arg("-DAIONE_ENABLE_STABLE_DIFFUSION=OFF")
        .arg("-DAIONE_VULKAN=OFF")
        .arg("-DAIONE_OPENCL=OFF")
        .arg("-DAIONE_VERBOSE=OFF")
        .arg("-DLLAMA_BUILD_TESTS=OFF")
        .arg("-DLLAMA_BUILD_EXAMPLES=OFF")
        .arg("-DLLAMA_BUILD_TOOLS=OFF")
        .arg("-DLLAMA_BUILD_SERVER=OFF");
    run(&mut configure);

    let mut build = Command::new("cmake");
    build
        .arg("--build")
        .arg(&build_dir)
        .arg("--config")
        .arg(config)
        .arg("--target")
        .arg("AIOneCore");
    run(&mut build);

    let mut install = Command::new("cmake");
    install
        .arg("--install")
        .arg(&build_dir)
        .arg("--config")
        .arg(config)
        .arg("--prefix")
        .arg(&install_dir);
    run(&mut install);

    link_prebuilt(&install_dir, &out_dir);
}

fn find_aione_dir(manifest_dir: &Path) -> Option<PathBuf> {
    if let Some(dir) = env::var_os("AIONE_DIR").map(PathBuf::from) {
        if is_aione_dir(&dir) {
            return Some(dir);
        }
    }

    [
        manifest_dir.join("../../AIOne"),
        manifest_dir.join("../AIOne"),
        manifest_dir.join("AIOne"),
    ]
    .into_iter()
    .find(|candidate| is_aione_dir(candidate))
}

fn is_aione_dir(dir: &Path) -> bool {
    dir.join("CMakeLists.txt").is_file() && dir.join("include").join("AIOne.h").is_file()
}

fn link_prebuilt(prefix: &Path, out_dir: &Path) {
    let lib_dir = if prefix.join("lib").is_dir() {
        prefix.join("lib")
    } else {
        prefix.to_path_buf()
    };
    let bin_dir = if prefix.join("bin").is_dir() {
        prefix.join("bin")
    } else {
        prefix.to_path_buf()
    };

    println!("cargo:rustc-link-search=native={}", lib_dir.display());
    println!("cargo:rustc-link-lib=AIOneCore");

    let profile_dir = out_dir
        .ancestors()
        .nth(3)
        .map(Path::to_path_buf)
        .expect("cargo profile directory");

    copy_runtime_libraries(&bin_dir, &profile_dir);

    if bin_dir != lib_dir {
        copy_runtime_libraries(&lib_dir, &profile_dir);
    }
}

fn copy_runtime_libraries(source_dir: &Path, destination_dir: &Path) {
    let Ok(entries) = fs::read_dir(source_dir) else {
        return;
    };

    for entry in entries.flatten() {
        let source = entry.path();

        if !is_runtime_library(&source) {
            continue;
        }

        let Some(name) = source.file_name() else {
            continue;
        };

        let destination = destination_dir.join(name);
        if let Err(error) = fs::copy(&source, &destination) {
            println!(
                "cargo:warning=Failed to copy {} to {}: {error}",
                source.display(),
                destination.display()
            );
        }
    }
}

fn is_runtime_library(path: &Path) -> bool {
    match path.extension().and_then(|extension| extension.to_str()) {
        Some("dll") | Some("so") | Some("dylib") => true,
        _ => path
            .file_name()
            .and_then(|name| name.to_str())
            .map(|name| name.contains(".so."))
            .unwrap_or(false),
    }
}

fn run(command: &mut Command) {
    let status = command
        .status()
        .unwrap_or_else(|error| panic!("Failed to run {command:?}: {error}"));

    if !status.success() {
        panic!("Command failed with {status}: {command:?}");
    }
}
